'use strict';

const urlUtil = require('./url_util');
const deltaFetch = require('./delta_fetch');
const fetchUtil = require('./fetch_util');

function fetchProxy(cache, originalRequest) {
  // get cached response which matches the request
  const serverResponseP = cache.match(originalRequest).then(cachedResponse => {

    // request cached and has same origin
    if (urlUtil.isSameOrigin(originalRequest.url, self.registration.scope) && cachedResponse !== undefined) {
      return fetch(
        // create delta request with cached ETag
        deltaFetch.createDeltaRequest(originalRequest, cachedResponse.headers.get('ETag'))
      ).then(serverResponse => {

        // server sent a patch (rather than the full file)
        if (serverResponse.status === 226 && serverResponse.headers.get('Delta-Base') === cachedResponse.headers.get('ETag')) {
          // use the patch on the cached file to create an updated response
          return deltaFetch.patchResponse(serverResponse, cachedResponse);
        }
        // no change from cached version
        else if (serverResponse.status === 304) {
          return Promise.resolve(deltaFetch.convert304to200(cachedResponse, serverResonse.headers));
        }
        else {
          return Promise.reject('Server gave unrecongized status code: ' + serverResonse.status);
        }
      });
    }
    else {
      // normal request without delta caching
      return fetch(originalRequest);
    }
  })
  
  serverResponseP.then(response => {
    deltaFetch.cacheIfHasEtag(cache, originalRequest, response.clone());
  })

  return serverResponseP;
}

module.exports = fetchProxy;


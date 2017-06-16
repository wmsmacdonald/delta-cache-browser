'use strict';

const urlUtil = require('./url_util');
const deltaFetch = require('./delta_fetch');
const fetchUtil = require('./fetch_util');

function fetchProxy(originalRequest, scope, cache) {
  // get cached response which matches the request
  const serverResponseP = cache.match(originalRequest).then(cachedResponse => {

    // request cached and has same origin
    if (urlUtil.isSameOrigin(originalRequest.url, scope)) {
      return fetch(
        // create delta request with cached ETag
        deltaFetch.createDeltaRequest(originalRequest, cachedResponse.headers.get('ETag'))
      ).then(processServerResponse.bind(null, cachedResponse));
    }
    else {
      // different origin, do normal request
      return fetch(originalRequest);
    }
  })
    // not in cache, no delta encoding available, do normal request
    .catch(() => fetch(originalRequest));
  
  serverResponseP.then(response => {
    deltaFetch.cacheIfHasEtag(cache, originalRequest, response.clone());
  })

  return serverResponseP;
}

// handle delta encoded and normal responses, return promise containing Response object
function processServerResponse(cachedResponse, serverResponse) {

  // server sent a patch (rather than the full file)
  if (serverResponse.status === 226 && serverResponse.headers.get('Delta-Base') === cachedResponse.headers.get('ETag')) {
    // use the patch on the cached file to create an updated response
    const newResponse = deltaFetch.patchResponse(serverResponse, cachedResponse);
    return Promise.resolve(newResponse);
  }
  // no change from cached version
  else if (serverResponse.status === 304) {
    const newResponse = deltaFetch.convert304to200(cachedResponse, serverResonse.headers)
    return Promise.resolve(newResponse);
  }
  // no delta encoding
  else {
    return Promise.resolve(serverResponse);
  }
}

module.exports = fetchProxy;


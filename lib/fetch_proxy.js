'use strict';

const urlUtil = require('./url_util');
const deltaFetch = require('./delta_fetch');
const fetchUtil = require('./fetch_util');

function fetchProxy(originalRequest, scope, cache) {
  // get cached response which matches the request
  const newResponse = cache.match(originalRequest).then(cachedResponse =>
    fetch(
      // create delta request with cached version of file
      deltaFetch.createDeltaRequest(originalRequest, cachedResponse.headers.get('ETag'))
    )
    // handle delta response to create normal response
    .then(processServerResponse.bind(null, cachedResponse))
  )
    // not in cache, no delta encoding available, do normal request
    .catch(() => fetch(originalRequest));
  
  newResponse.then(response => {
    deltaFetch.cacheIfHasEtag(cache, originalRequest, response.clone());
  })

  return newResponse;
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


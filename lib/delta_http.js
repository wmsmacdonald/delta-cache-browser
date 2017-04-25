'use strict';

const fetchUtil = require('./fetch_util');
const vcdiff = require('vcdiff-decoder');

// cache the request/response if response contains the Delta-Version header
function cacheIfHasEtag(cache, request, response) {
  if (response.headers.has('ETag')) {
    return cache.delete(request).then(() => {
      return cache.put(request, response.clone());
    });
  }
  else {
    return Promise.resolve();
  }
}

function createDeltaRequest(originalRequest, cachedEtag) {
  const headers = fetchUtil.cloneHeaders(originalRequest.headers);
  headers.set('A-IM', 'vcdiff');
  headers.set('If-None-Match', cachedEtag);

  // return new request with delta headers
  return new Request(originalRequest.url, {
    method: originalRequest.method,
    headers: headers,
    // can't create request with mode 'navigate', so we put 'same-origin'
    // since we know it's the same origin
    mode: originalRequest.mode === 'navigate' ?
      'same-origin' : originalRequest.mode,
    credentials: originalRequest.credentials,
    redirect: 'manual'
  });
}

// create 200 response from 304 response
function convert304To200(response, newHeaders) {
  response.blob().then(blob => {
    const headers = fetchUtil.cloneHeaders(newHeaders);
    headers.set('Content-Type', cachedResponse.headers.get('Content-Type'));
    headers.delete('Content-Length');

    return new Response(blob, {
      status: 200,
      statusText: 'OK',
      headers,
      url: serverResponse.url
    });
  })
}

// takes a response with a patch in the body and applies the patch to the other response and returns a
// promise resolving to a new response
function patchResponse(patchResponse, responseToChange) {
  return Promise.all([patchResponse.arrayBuffer(), responseToChange.arrayBuffer()]).then(([deltaArrayBuffer, sourceArrayBuffer]) => {
    let delta = new Uint8Array(deltaArrayBuffer);
    let source = new Uint8Array(sourceArrayBuffer);

    let updated = vcdiff.decodeSync(delta, source);
    let headers = fetchUtil.cloneHeaders(patchResponse.headers);
    headers.set('Content-Type', responseToChange.headers.get('Content-Type'));
    headers.delete('Content-Length');

    return new Response(updated, {
      status: 200,
      statusText: 'OK',
      headers: headers,
      url: patchResponse.url
    });
  });
}

module.exports = {
  cacheIfHasEtag,
  createDeltaRequest,
  convert304To200,
  patchResponse
}

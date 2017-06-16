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

// creates copy of request that contains the Etag of the cached response
// as well as other headers
function createDeltaRequest(originalRequest, cachedEtag) {
  const headers = fetchUtil.cloneHeaders(originalRequest.headers);

  // set VCDIFF encoding headers
  headers.set('A-IM', 'vcdiff');
  headers.set('If-None-Match', cachedEtag);

  // return new request with delta headers
  return new Request(originalRequest.url, {
    method: originalRequest.method,
    headers,
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

    header.set('X-Delta-Length', '0');

    return new Response(blob, {
      status: 200,
      statusText: 'OK',
      headers,
      url: serverResponse.url
    });
  })
}

// takes a delta response and applies its patch to the other response
// returns a promise resolving to the new response
function patchResponse(patchResponse, responseToChange) {
  return Promise.all([patchResponse.arrayBuffer(), responseToChange.arrayBuffer()]).then(([deltaArrayBuffer, sourceArrayBuffer]) => {
    const delta = new Uint8Array(deltaArrayBuffer);
    const source = new Uint8Array(sourceArrayBuffer);

    const updated = vcdiff.decodeSync(delta, source);
    const headers = fetchUtil.cloneHeaders(patchResponse.headers);

    if (responseToChange.headers.has('Content-Type')) {
      headers.set('Content-Type', responseToChange.headers.get('Content-Type'));
    }

    // discard delta headers
    headers.delete('Content-Length');
    headers.delete('Delta-Base');
    headers.delete('im');

    headers.set('X-Delta-Length', deltaArrayBuffer.byteLength.toString());

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

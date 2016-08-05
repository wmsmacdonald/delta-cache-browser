'use strict';
const DiffMatchPatch = require('diff-match-patch');

let diff = new DiffMatchPatch();

self.addEventListener('install', function(event) {
  self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  // cleans cache every time the service worker is initialized
  /*event.waitUntil(
   caches.delete('delta')
   );*/
});

self.onfetch = function(event) {
  let cache;
  let cachedEtag;
  let cachedResponse;
  let finalResponse;

  let responseP = caches.open('delta').then(function(matchingCache) {
    cache = matchingCache;
    return cache.match(event.request);

  }).then(response => {
    cachedResponse = response;

    let init = {};
    // request not cached
    if (cachedResponse !== undefined && event.request.mode !== 'navigate') {
      cachedEtag = cachedResponse.headers.get('ETag');
      init.headers = {
        'A-IM': 'googlediffjson',
        'If-None-Match': cachedEtag
      }
    }
    return fetch(new Request(event.request, init));

  }).then(serverResponse => {
    // server sent a patch (rather than the full file)
    if (serverResponse.status === 226 && serverResponse.headers.get('Delta-Base') ===  cachedEtag) {
      // use the patch on the cached file to create an updated response
      return patchResponse(serverResponse, cachedResponse);
    }
    // no change from cached version
    else if (serverResponse.status === 304) {
      return cachedResponse.text().then(text => {
        let headers = cloneHeaders(serverResponse.headers);
        headers.set('Content-Type', cachedResponse.headers.get('Content-Type'));
        headers.delete('Content-Length');

        return new Response(text, {
          status: 200,
          statusText: 'OK',
          headers: headers,
          url: serverResponse.url
        });
      });

    }
    // normal non-cached response
    else {
      return Promise.resolve(serverResponse);
    }
  }).then(response => {
    finalResponse = response;
    return cacheIfHasEtag(cache, event.request, finalResponse.clone());
  }).then(() => {
    return finalResponse;
  });
  event.respondWith(responseP);
  return responseP;
};

// takes a response with a patch in the body and applies the patch to the other response and returns a
// promise resolving to a new response
function patchResponse(patchResponse, response) {
  return Promise.all([patchResponse.json(), response.text()]).then(([patch, responseBody]) => {
    let updatedBody = diff.patch_apply(patch, responseBody)[0];
    let headers = cloneHeaders(patchResponse.headers);
    headers.set('Content-Type', response.headers.get('Content-Type'));
    headers.delete('Content-Length');

    return new Response(updatedBody, {
      status: 200,
      statusText: 'OK',
      headers: headers,
      url: patchResponse.url
    });
  });
}

// cache the request/response if response contains the Delta-Version header
function cacheIfHasEtag(cache, request, response) {
  if (response.headers.has('ETag')) {
    return cache.delete(request).then(() => {
      return cache.put(request, response.clone());
    });
  }
}

// copies all headers into a new Headers
function cloneHeaders(headers) {
  let headersClone = new Headers();
  for (let [name, value] of headers.entries()) {
    headersClone.append(name, value);
  }
  return headersClone;
}

function printHeaders(headers) {
  for (let [name, value] of headers.entries()) {
    console.log(name + ': ' + value);
  }
}
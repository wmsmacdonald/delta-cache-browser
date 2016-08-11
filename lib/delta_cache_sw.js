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
  let clientRequest = event.request;

  let cache;
  let cachedEtag;
  let cachedResponse;
  let finalResponse;

  let responseP = caches.open('delta').then(function(matchingCache) {
    cache = matchingCache;
    return cache.match(event.request);

  }).then(response => {
    cachedResponse = response;

    let headers = cloneHeaders(clientRequest.headers);

    let parsedRequestUrl = getLocation(clientRequest.url);
    let parsedScope = getLocation(self.registration.scope);

    console.log(parsedRequestUrl);
    console.log(parsedScope);

    let init = {}

    // request not cached
    //if (cachedResponse !== undefined && event.request.mode !== 'navigate') {
    if (cachedResponse !== undefined) {
      cachedEtag = cachedResponse.headers.get('ETag');
      headers.set('A-IM', 'googlediffjson');
      headers.set('If-None-Match', cachedEtag);
      init.headers = headers;

      if (parsedRequestUrl.host === parsedScope.host && parsedRequestUrl.protocol === parsedScope.protocol) {
        init.origin = 'same-origin'
      }

      let requestToServer = new Request(clientRequest.url, {
        method: clientRequest.method,
        headers: headers,
        mode: 'same-origin',
        credentials: clientRequest.credentials,
        redirect: 'manual'
      });
    }

    return fetch(clientRequest, )
    printHeaders(clientRequest.headers);


    return fetch(requestToServer);

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

function getLocation(href) {
  var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
  return match && {
      protocol: match[1],
      host: match[2],
      hostname: match[3],
      port: match[4],
      pathname: match[5],
      search: match[6],
      hash: match[7]
    }
}
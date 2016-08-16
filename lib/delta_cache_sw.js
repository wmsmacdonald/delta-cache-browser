'use strict';

const fetchUtil = require('./fetch_util');
let cache;

self.addEventListener('install', function(event) {
  self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  // cleans cache and sets the cache as a global

  event.waitUntil(
    caches.delete('delta').then(() => caches.open('delta')).then(deltaCache => {
     cache = deltaCache;
    })
  );
});


self.onfetch = function(event) {
  let clientRequest = event.request;

  let cachedEtag;
  let cachedResponse;
  let finalResponse;

  let cacheMatchP = cache.match(event.request);
  cacheMatchP.catch(err => console.log(err));


  let responseP = cacheMatchP.then(response => {
    console.log(response);
    cachedResponse = response;

    let isSameOrigin = sameOrigin(clientRequest.url, self.registration.scope);

    // request cached and has same origin
    if (isSameOrigin && cachedResponse !== undefined) {

      // add delta headers
      let headers = fetchUtil.cloneHeaders(clientRequest.headers);
      cachedEtag = cachedResponse.headers.get('ETag');
      headers.set('A-IM', 'googlediffjson');
      headers.set('If-None-Match', cachedEtag);

      let init = {
        method: clientRequest.method,
        headers: headers,
        mode: clientRequest.mode,
        credentials: clientRequest.credentials,
        redirect: 'manual'
      };

      // can't create request with mode 'navigate', so we put 'same-origin'
      // since we know it's the same origin
      if (clientRequest.mode === 'navigate') {
        init.mode = 'same-origin';
      }

      return fetch(new Request(clientRequest.url, init));
    }
    else {
      return fetch(clientRequest);
    }

    // patch response if delta
  }).then(serverResponse => {
    // server sent a patch (rather than the full file)
    if (serverResponse.status === 226 && serverResponse.headers.get('Delta-Base') === cachedEtag) {
      // use the patch on the cached file to create an updated response
      return fetchUtil.patchResponse(serverResponse, cachedResponse);
    }
    // no change from cached version
    else if (serverResponse.status === 304) {
      return cachedResponse.text().then(text => {
        let headers = fetchUtil.cloneHeaders(serverResponse.headers);
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
  }).catch(err => {
    console.log(err);
  });
  event.respondWith(responseP);
};

// cache the request/response if response contains the Delta-Version header
function cacheIfHasEtag(cache, request, response) {
  if (response.headers.has('ETag')) {
    return cache.delete(request).then(() => {
      return cache.put(request, response.clone());
    });
  }
}

// returns whether the origins or the two urls are the same
function sameOrigin(url1, url2) {
  let parsedRequestUrl = getLocation(url1);
  let parsedCurrentUrl = getLocation(url2);

  return parsedRequestUrl.host === parsedCurrentUrl.host
    && parsedRequestUrl.protocol === parsedCurrentUrl.protocol;
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
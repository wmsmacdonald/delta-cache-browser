'use strict';

const fetchProxy = require('./fetch_proxy');

const CACHE_NAME  = 'delta-cache-v1';

self.addEventListener('install', function(event) {
  // forces the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // extend lifetime of event until cache is deleted
  event.waitUntil(
    // deletes cache to prevent incompatibility between requests
    caches.delete(CACHE_NAME)
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(
      // a proxy between the client and the server
      // returns a promise that contains a response
      fetchProxy.bind(null, event.request, self.registration.scope)
    )
  );
});


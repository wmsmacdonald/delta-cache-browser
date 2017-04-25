'use strict';

const fetchProxy = require('./fetch_proxy');

const CACHE_NAME  = 'delta-cache-v1';

self.addEventListener('install', function(event) {
  // forces the waiting service worker to become the active service worker
  self.skipWaiting();
});

let deltaCache; // global so fetch event can access

self.addEventListener('activate', function(event) {
  event.waitUntil(
    // deletes cache to prevent incompatiblity between requests (not necessary in production)
    // opens new cache before listening for fetch events
    caches.delete(CACHE_NAME).then(() => caches.open(CACHE_NAME)).then(cache => {
      deltaCache = cache;
    })
  );
});

self.onfetch = function(event) {
  event.respondWith(
    // function is a proxy between the client and the server
    // returns a promise that contains a response
    fetchProxy(deltaCache, event.request)
  );
}


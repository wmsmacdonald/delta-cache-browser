# delta-cache-browser

Partially cache dynamic content and send only the changes over the wire.

When used with dynamic content, [delta encoding can provide 62%-65% savings for HTML files](http://www.webreference.com/internet/software/servers/http/deltaencoding/intro/printversion.html).

There's no need to change any of your requests - simply include the following code and the service worker will automatically intercept requets and use delta caching in available.

```javascript
// install the service worker if service workers are supported
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('delta_cache_ws.js').then(function(registration) {
    console.log('delta cache service worker registered');
  }).catch(err => {
    console.log('service worker failed to register');
  });
}
```

If service workers are not supported, it will fallback to normal browser control.

Designed to work with [delta-cache-express](https://github.com/wmsmacdonald/delta-cache-express), but it semi-complies with [RFC 3229](https://tools.ietf.org/html/rfc3229). The exceptions (may be changed in future releases):
* Browser only caches the latest version of a resource
* The only IM (instance manipulation) available is `googlediffjson`, which is encoded by JSON stringified patches returned from the [google-diff-match-patch algorithm](https://code.google.com/p/google-diff-match-patch/wiki/API).

# delta-cache-browser

Partially cache dynamic content and send only the changes over the wire.

When used with dynamic content, [delta encoding can provide 62%-65% savings for HTML files](http://www.webreference.com/internet/software/servers/http/deltaencoding/intro/printversion.html).

There's no need to change any of your requests - simply include the following code and the service worker will automatically intercept requests and use delta caching if available.

### Usage
```javascript
// register the service worker if service workers are supported
if ('serviceWorker' in navigator) {
  // register the service worker (will activate with document reload)
  navigator.serviceWorker.register('delta_cache_sw.js').then(function() {
    console.log('delta cache service worker registered');
  });
}
```

If service workers are not supported, it will fallback to normal browser control.

Works with any [RFC 3229](https://tools.ietf.org/html/rfc3229) compliant server. The encoding used for the deltas is `vcdiff`, an [efficient and flexible binary delta encoding format](https://tools.ietf.org/html/rfc3229).

Server Implementations:
* [delta-cache-express](https://github.com/wmsmacdonald/delta-cache-express)
* [delta-cache-node](https://github.com/wmsmacdonald/delta-cache-node)

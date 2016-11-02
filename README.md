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
![Chrome](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/37.1.9/archive/chrome_12-48/chrome_12-48_48x48.png)
![Firefox](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/37.1.9/archive/firefox_1.5-3/firefox_1.5-3_48x48.png)

Delta-Cache relies on services workers, which are currently only supported in Firefox and Chrome.

If service workers are not supported, it will fallback to normal browser control.

Works with any [RFC 3229](https://tools.ietf.org/html/rfc3229) compliant server. The encoding used for the deltas is `vcdiff`, an [efficient and flexible binary delta encoding format](https://tools.ietf.org/html/rfc3229).

Server Implementations:
* [delta-cache-express](https://github.com/wmsmacdonald/delta-cache-express)
* [delta-cache-node](https://github.com/wmsmacdonald/delta-cache-node)

### How it Works
All GET requests go through the service worker.

![delta-cache](https://cloud.githubusercontent.com/assets/9937668/19878794/f39831b4-9fba-11e6-8e2c-033c1bb46d01.png)

The first time the URL is requested, it will get the content from the server as usual. The service worker will then cache the response, so the next time the same URL is requested, it'll ask the server to use delta encoding. The server then sends the difference between the old and the new file. The service worker will use this delta to compute the new file using the cached version.

Because only the changes are sent from the server, the file sizes are much smaller.

Delta-Cache works well with text content that barely changes, such as server generated pages and web API endpoints.

### Testing
```bash
npm test
```
This command will open a browser page. Reload the page so that the service worker can install and the Mocha test suite will run. The service worker is automatically removed when the mocha test finishes.
Open chrome://serviceworker-internals/ in chrome to debug or remove the service worker.

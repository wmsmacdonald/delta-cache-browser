'use strict';

//mocha.checkLeaks();
mocha.globals(['jQuery']);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('delta_cache_sw.js').then(function(registration) {
    //window.serviceWorkerRegistration = registration;

    // document must reload for requests to go through service worker
    if (registration.active === null) {
      document.write('reload to run tests (document must be controlled by the service worker)');
    }
    else {
      mocha.run(() => {
        // uninstall service worker so it can be installed clean next time
        registration.unregister().then(success => {
          if (!success) {
            document.write('could not unregister service worker');
          }
          return caches.delete('delta');
        }).then(success => {
          if (!success) {
            document.write('could not delete delta cache');
          }
        });
      });
    }

  }).catch(function(err) {
    document.write('service worker failed to register')
  });
}
else {
  document.write('service worker not supported');
}

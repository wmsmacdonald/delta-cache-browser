'use strict';

//mocha.checkLeaks();
mocha.globals(['jQuery']);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('delta_cache_ws.js').then(function(registration) {
    //window.serviceWorkerRegistration = registration;

    // document must reload for requests to go through service worker
    if (registration.active === null) {
      document.write('reload to run tests (document must be controlled by the service worker)');
    }
    else {
      mocha.run(() => {
        // uninstall service worker so it can be installed clean next time
        registration.unregister().then(function(success) {
          if (!success) {
            throw new Error('could not unregister service worker');
          }
        });
      });
    }

    //setInterval(getDynamic, 5000);

  }).catch(function(err) {
    document.write('service worker failed to register')
  });
}
else {
  console.log('service worker not supported');
}

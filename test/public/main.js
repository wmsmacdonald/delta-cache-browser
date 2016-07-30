'use strict';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service_worker.js').then(function(reg) {
    console.log(':^)', reg);

    setInterval(getDynamic, 5000);

  }).catch(function(err) {
    console.log(':^(', err);
  });
}
else {
  console.log('service worker not supported');
}

function getDynamic() {
  $.ajax('https://localhost:8000/dymanicContent').then((response, status, jqXHR) => {
    console.log(response);
    console.log(jqXHR.getAllResponseHeaders());
  });
}
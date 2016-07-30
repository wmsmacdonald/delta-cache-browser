if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('delta_cache_ws.js').then(function(registration) {
    if (registration.active === null) {
      //location.reload();
    }
    console.log(':^)', registration);

    setInterval(getDynamic, 5000);

  }).catch(function(err) {
    console.log(':^(', err);
  });
}
else {
  console.log('service worker not supported');
}

function getDynamic() {
  $.ajax('http://localhost:8080/dynamicContent').then(function(response, status, jqXHR) {
    console.log('got response');
    console.log(response);
    console.log(jqXHR.getAllResponseHeaders());
  });
}

/*mocha.checkLeaks();
mocha.globals(['jQuery']);
mocha.run();


describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      expect([1,2,3].indexOf(5)).to.eql(-1);
      expect([1,2,3].indexOf(0)).to.eql(-1);
    });
  });
});*/
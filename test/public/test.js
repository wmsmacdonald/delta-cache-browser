describe('delta_cache_sw.js', function() {

  describe('static content', function() {
    it('should return correct content', function(done) {
      $.get('/staticContent').then((responseBody, _, xhrRequest) => {
        expect(responseBody).to.be('single response');
        return $.get('/staticContent');
      }).then((responseBody, _, xhrRequest) => {
        expect(responseBody).to.be('single response');
        done();
      }).catch(err => {
        done(err);
      });
    });
    it("should return correct content cross origin", function(done) {
      let url = 'https://www.googleapis.com/discovery/v1/apis?fields=';
      fetch('https://www.googleapis.com/discovery/v1/apis?fields=')
      .then(response => response.json()).then(message => {
        expect(message).to.be.empty();
        return fetch('https://www.googleapis.com/discovery/v1/apis?fields=');
      }).then(response => response.json()).then(message => {
        expect(message).to.be.empty();
        done();
      }).catch(err => {
        done(err);
      });
    });
  });

  describe('no delta content', function() {
    it('should return correct content', function(done) {
      $.get('/staticContent').then((responseBody, _, xhrRequest) => {
        expect(responseBody).to.be('single response');
        return $.get('/staticContent');
      }).then((responseBody, _, xhrRequest) => {
        expect(responseBody).to.be('single response');
        done();
      }).catch(err => {
        done(err);
      });
    });
  });

  describe('dynamic content', function() {
    it('should return correct content', function(done) {
      $.get('/dynamicContent').then((responseBody, _, xhrRequest) => {
        expect(responseBody).to.be('version 1');
        return $.get('/dynamicContent');
      }).then((responseBody, _, xhrRequest) => {
        expect(responseBody).to.be('version 2');
        expect(xhrRequest.getResponseHeader('IM')).to.be('vcdiff');
        done();
      }).catch(err => {
        done(err);
      });
    });
  });

});
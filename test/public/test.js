describe('delta_cache_sw.js', function() {

  describe('static sample_text', function() {
    it('should return correct sample_text, without X-Delta-Length header', function(done) {
      fetch('/staticContent').then(response => {
        expect(response.headers.has('X-Delta-Length')).to.be.false
        return response.text().then(responseBody => {
          expect(responseBody).to.be('single response');
          return fetch('/staticContent');
        });
      }).then(response => {
        expect(response.headers.has('X-Delta-Length')).to.be.false
        response.text().then(responseBody => {
          expect(responseBody).to.be('single response');
          done();
        });
      }).catch(err => {
        done(err);
      });
    });
  });

  describe('no delta sample_text', function() {
    it('should return correct sample_text', function(done) {
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

  describe('dynamic sample_text', function() {
    it('should return correct sample_text, with X-Delta-Length header for second request', function(done) {
      return fetch('/dynamicContent').then(response => {
        expect(response.headers.has('X-Delta-Length')).to.be.false
        return response.text().then(responseBody => {
          expect(responseBody).to.be('version 1');
          return fetch('/dynamicContent')
        });
      }).then(response => {
        expect(response.headers.get('X-Delta-Length')).to.equal('24')
        return response.text().then(responseBody => {
          expect(responseBody).to.be('version 2');
          done();
        });
      }).catch(err => {
        done(err);
      });
    });
  });

});

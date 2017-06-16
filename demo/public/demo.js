'use strict'

$(function() {
  const log = str => $('#log-box').append(str).append('<br>').scrollTop(Number.MAX_SAFE_INTEGER)

  function countUtf8Bytes(s) {
    var b = 0, i = 0, c
    for(;c=s.charCodeAt(i++);b+=c>>11?3:c>>7?2:1);
    return b
  }

  function showResponse(response) {
    return response.text().then(text => {
      $('#content').html(text)

      const actualSize = countUtf8Bytes(text)
      
      // was delta encoded in service worker
      if (response.headers.has('X-Delta-Length')) {
        const deltaSize = parseInt(response.headers.get('X-Delta-Length'))
        log(`Fetched file using delta encoding - ${deltaSize} bytes received instead of ${actualSize} bytes`)
      }
      else {
        log(`Fetched file without delta encoding - ${actualSize} bytes received`)
      }
    })
  }

  $('#fetch-normal-button').click(function() {
    fetch('/normalContent').then(showResponse);
  });

  $('#fetch-delta-button').click(function() {
    fetch('/deltaEncodedContent').then(showResponse);
  });


  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('delta_cache_sw.js').then(function(registration) {

      // document must reload for requests to go through service worker
      if (registration.active === null) {
        window.location.reload()
      }

    }).catch(err => alert('Service worker failed to register: ' + err))
  }
  else {
    alert('Service worker not supported, please use Chrome')
  }
})



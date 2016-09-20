'use strict';
const vcdiff = require('vcdiff-decoder');


// copies all headers into a new Headers
function cloneHeaders(headers) {
  let headersClone = new Headers();
  for (let [name, value] of headers.entries()) {
    headersClone.append(name, value);
  }
  return headersClone;
}

function printHeaders(headers) {
  for (let [name, value] of headers.entries()) {
    console.log(name + ': ' + value);
  }
}

// takes a response with a patch in the body and applies the patch to the other response and returns a
// promise resolving to a new response
function patchResponse(patchResponse, responseToChange) {
  return Promise.all([patchResponse.arrayBuffer(), responseToChange.arrayBuffer()]).then(([deltaArrayBuffer, sourceArrayBuffer]) => {
    let delta = new Uint8Array(deltaArrayBuffer);
    let source = new Uint8Array(sourceArrayBuffer);

    let updated = vcdiff.decodeSync(delta, source);
    let headers = cloneHeaders(patchResponse.headers);
    headers.set('Content-Type', responseToChange.headers.get('Content-Type'));
    headers.delete('Content-Length');

    return new Response(updated, {
      status: 200,
      statusText: 'OK',
      headers: headers,
      url: patchResponse.url
    });
  });
}

module.exports = {
  cloneHeaders,
  printHeaders,
  patchResponse
};
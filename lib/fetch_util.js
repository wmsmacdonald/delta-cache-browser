'use strict';
const DiffMatchPatch = require('diff-match-patch');

let diff = new DiffMatchPatch();


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
  return Promise.all([patchResponse.json(), responseToChange.text()]).then(([patch, responseBody]) => {
    let updatedBody = diff.patch_apply(patch, responseBody)[0];
    let headers = cloneHeaders(patchResponse.headers);
    headers.set('Content-Type', responseToChange.headers.get('Content-Type'));
    headers.delete('Content-Length');

    return new Response(updatedBody, {
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
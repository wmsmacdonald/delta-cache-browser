'use strict';

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


module.exports = {
  cloneHeaders,
  printHeaders
};

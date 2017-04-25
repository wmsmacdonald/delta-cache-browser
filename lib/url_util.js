'use strict';


// returns whether the origins or the two urls are the same
function isSameOrigin(url1, url2) {
  let parsedRequestUrl = getLocation(url1);
  let parsedCurrentUrl = getLocation(url2);

  return parsedRequestUrl.host === parsedCurrentUrl.host
    && parsedRequestUrl.protocol === parsedCurrentUrl.protocol;
}

function getLocation(href) {
  var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
  return match && {
      protocol: match[1],
      host: match[2],
      hostname: match[3],
      port: match[4],
      pathname: match[5],
      search: match[6],
      hash: match[7]
    }
}

module.exports = {
	isSameOrigin,
	getLocation
}

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	const fetchProxy = __webpack_require__(1);

	const CACHE_NAME  = 'delta-cache-v1';

	self.addEventListener('install', function(event) {
	  // forces the waiting service worker to become the active service worker
	  self.skipWaiting();
	});

	self.addEventListener('activate', function(event) {
	  // extend lifetime of event until cache is deleted
	  event.waitUntil(
	    // deletes cache to prevent incompatibility between requests
	    caches.delete(CACHE_NAME)
	  );
	});

	self.addEventListener('fetch', function(event) {
	  event.respondWith(
	    caches.open(CACHE_NAME).then(
	      // a proxy between the client and the server
	      // returns a promise that contains a response
	      fetchProxy.bind(null, event.request, self.registration.scope)
	    )
	  );
	});



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	const urlUtil = __webpack_require__(2);
	const deltaFetch = __webpack_require__(3);
	const fetchUtil = __webpack_require__(4);

	function fetchProxy(originalRequest, scope, cache) {
	  // get cached response which matches the request
	  const newResponse = cache.match(originalRequest).then(cachedResponse =>
	    fetch(
	      // create delta request with cached version of file
	      deltaFetch.createDeltaRequest(originalRequest, cachedResponse.headers.get('ETag'))
	    )
	    // handle delta response to create normal response
	    .then(processServerResponse.bind(null, cachedResponse))
	  )
	    // not in cache, no delta encoding available, do normal request
	    .catch(() => fetch(originalRequest));
	  
	  newResponse.then(response => {
	    deltaFetch.cacheIfHasEtag(cache, originalRequest, response.clone());
	  })

	  return newResponse;
	}

	// handle delta encoded and normal responses, return promise containing Response object
	function processServerResponse(cachedResponse, serverResponse) {

	  // server sent a patch (rather than the full file)
	  if (serverResponse.status === 226 && serverResponse.headers.get('Delta-Base') === cachedResponse.headers.get('ETag')) {
	    // use the patch on the cached file to create an updated response
	    const newResponse = deltaFetch.patchResponse(serverResponse, cachedResponse);
	    return Promise.resolve(newResponse);
	  }
	  // no change from cached version
	  else if (serverResponse.status === 304) {
	    const newResponse = deltaFetch.convert304to200(cachedResponse, serverResonse.headers)
	    return Promise.resolve(newResponse);
	  }
	  // no delta encoding
	  else {
	    return Promise.resolve(serverResponse);
	  }
	}

	module.exports = fetchProxy;



/***/ }),
/* 2 */
/***/ (function(module, exports) {

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


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	const fetchUtil = __webpack_require__(4);
	const vcdiff = __webpack_require__(5);

	// cache the request/response if response contains the Delta-Version header
	function cacheIfHasEtag(cache, request, response) {
	  if (response.headers.has('ETag')) {
	    return cache.delete(request).then(() => {
	      return cache.put(request, response.clone());
	    });
	  }
	  else {
	    return Promise.resolve();
	  }
	}

	// creates copy of request that contains the Etag of the cached response
	// as well as other headers
	function createDeltaRequest(originalRequest, cachedEtag) {
	  const headers = fetchUtil.cloneHeaders(originalRequest.headers);

	  // set VCDIFF encoding headers
	  headers.set('A-IM', 'vcdiff');
	  headers.set('If-None-Match', cachedEtag);

	  // return new request with delta headers
	  return new Request(originalRequest.url, {
	    method: originalRequest.method,
	    headers,
	    // can't create request with mode 'navigate', so we put 'same-origin'
	    // since we know it's the same origin
	    mode: originalRequest.mode === 'navigate' ?
	      'same-origin' : originalRequest.mode,
	    credentials: originalRequest.credentials,
	    redirect: 'manual'
	  });
	}

	// create 200 response from 304 response
	function convert304To200(response, newHeaders) {
	  response.blob().then(blob => {
	    const headers = fetchUtil.cloneHeaders(newHeaders);
	    headers.set('Content-Type', cachedResponse.headers.get('Content-Type'));
	    headers.delete('Content-Length');

	    header.set('X-Delta-Length', '0');

	    return new Response(blob, {
	      status: 200,
	      statusText: 'OK',
	      headers,
	      url: serverResponse.url
	    });
	  })
	}

	// takes a delta response and applies its patch to the other response
	// returns a promise resolving to the new response
	function patchResponse(patchResponse, responseToChange) {
	  return Promise.all([patchResponse.arrayBuffer(), responseToChange.arrayBuffer()]).then(([deltaArrayBuffer, sourceArrayBuffer]) => {
	    const delta = new Uint8Array(deltaArrayBuffer);
	    const source = new Uint8Array(sourceArrayBuffer);

	    const updated = vcdiff.decodeSync(delta, source);
	    const headers = fetchUtil.cloneHeaders(patchResponse.headers);

	    if (responseToChange.headers.has('Content-Type')) {
	      headers.set('Content-Type', responseToChange.headers.get('Content-Type'));
	    }

	    // discard delta headers
	    headers.delete('Content-Length');
	    headers.delete('Delta-Base');
	    headers.delete('im');

	    headers.set('X-Delta-Length', deltaArrayBuffer.byteLength.toString());

	    return new Response(updated, {
	      status: 200,
	      statusText: 'OK',
	      headers: headers,
	      url: patchResponse.url
	    });
	  });
	}

	module.exports = {
	  cacheIfHasEtag,
	  createDeltaRequest,
	  convert304To200,
	  patchResponse
	}


/***/ }),
/* 4 */
/***/ (function(module, exports) {

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


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	const errors = __webpack_require__(6);
	const VCDiff = __webpack_require__(7);

	/**
	 *
	 * @param delta {Uint8Array}
	 * @param source {Uint8Array}
	 */
	function decodeSync(delta, source) {
	  let vcdiff = new VCDiff(delta, source);
	  return vcdiff.decode();
	}

	function decode(delta, buffer) {

	}

	module.exports = {
	  decodeSync,
	  decode
	};




/***/ }),
/* 6 */
/***/ (function(module, exports) {

	'use strict';
	/**
	 * Takes in array of names of errors and returns an object mapping those names to error functions that take in one parameter that is used as the message for the error
	 * @param names {[]}
	 * @returns {{name1: function(message),...}}
	 * @constructor
	 */
	function CustomErrors(names) {
	  let errors = {};
	  names.forEach(name => {
	    let CustomError = function CustomError(message) {
	      var temp = Error.apply(this, arguments);
	      temp.name = this.name = name;
	      this.stack = temp.stack;
	      this.message = temp.message;
	      this.name = name;
	      this.message = message;
	    };
	    CustomError.prototype = Object.create(Error.prototype, {
	      constructor: {
	        value: CustomError,
	        writable: true,
	        configurable: true
	      }
	    });
	    errors[name] = CustomError;
	  });
	  return errors;
	}

	module.exports = CustomErrors(['NotImplemented', 'InvalidDelta']);

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	const errors = __webpack_require__(6);
	const TypedArray = __webpack_require__(8);
	const deserializeInteger = __webpack_require__(9);
	const deserializeDelta = __webpack_require__(10);
	const NearCache = __webpack_require__(13);
	const SameCache = __webpack_require__(14);

	/**
	 *
	 * @param delta {Uint8Array}
	 * @param source {Uint8Array}
	 * @constructor
	 */
	function VCDiff(delta, source) {
	  this.delta = delta;
	  this.position = 0;
	  this.source = source;
	  this.targetWindows = new TypedArray.TypedArrayList();
	}

	VCDiff.prototype.decode = function() {
	  this._consumeHeader();
	  while (this._consumeWindow()) {}

	  let targetLength = this.targetWindows.typedArrays.reduce((sum, uint8Array) => uint8Array.length + sum, 0);
	  let target = new Uint8Array(targetLength);
	  let position = 0;

	  // concat all uint8arrays
	  for (let arrayNum = 0; arrayNum < this.targetWindows.typedArrays.length; arrayNum++) {
	    let array = this.targetWindows.typedArrays[arrayNum];
	    let length = array.length;
	    target.set(array, position);
	    position += length;
	  }

	  return target;
	};

	VCDiff.prototype._consumeHeader = function() {

	  let hasVCDiffHeader = this.delta[0] === 214 && // V
	      this.delta[1] === 195 && // C
	      this.delta[2] === 196 && // D
	      this.delta[3] === 0; // \0

	  if (!hasVCDiffHeader) {
	    throw new errors.InvalidDelta('first 3 bytes not VCD');
	  }

	  let hdrIndicator = this.delta[4];
	  // extract least significant bit
	  let vcdDecompress = 1 & hdrIndicator;
	  // extract second least significant bit
	  let vcdCodetable = 1 & (hdrIndicator >> 1);

	  // verify not using Hdr_Indicator
	  if (vcdDecompress || vcdCodetable) {
	    throw new errors.NotImplemented(
	      'non-zero Hdr_Indicator (VCD_DECOMPRESS or VCD_CODETABLE bit is set)'
	    );
	  }

	  this.position += 5;
	};

	VCDiff.prototype._consumeWindow = function() {
	  let winIndicator = this.delta[this.position++];

	  // extract least significant bit
	  let vcdSource = 1 & winIndicator;
	  // extract second least significant bit
	  let vcdTarget = 1 & (winIndicator >> 1);

	  if (vcdSource && vcdTarget) {
	    throw new errors.InvalidDelta(
	      'VCD_SOURCE and VCD_TARGET cannot both be set in Win_Indicator'
	    )
	  }
	  else if (vcdSource) {
	    let sourceSegmentLength, sourceSegmentPosition, deltaLength;
	    ({ value: sourceSegmentLength, position: this.position } = deserializeInteger(this.delta, this.position));
	    ({ value: sourceSegmentPosition, position: this.position } = deserializeInteger(this.delta, this.position));
	    ({ value: deltaLength, position: this.position } = deserializeInteger(this.delta, this.position));

	    let sourceSegment = this.source.slice(sourceSegmentPosition, sourceSegmentPosition + sourceSegmentLength);
	    this._buildTargetWindow(this.position, sourceSegment);
	    this.position += deltaLength;
	  }
	  else if (vcdTarget) {
	    throw new errors.NotImplemented(
	      'non-zero VCD_TARGET in Win_Indicator'
	    )
	  }
	  return this.position < this.delta.length;
	};

	// first integer is target window length
	VCDiff.prototype._buildTargetWindow = function(position, sourceSegment) {
	  let window = deserializeDelta(this.delta, position);

	  let T = new Uint8Array(window.targetWindowLength);

	  let U = new TypedArray.TypedArrayList();
	  U.add(sourceSegment);
	  U.add(T);

	  let targetPosition = this.source.length;
	  let dataPosition = 0;

	  let delta = new Delta(U, this.source.length, window.data, window.addresses);
	  window.instructions.forEach(instruction => {
	    instruction.execute(delta);
	  });

	  let target = U.typedArrays[1];
	  this.targetWindows.add(target);
	};

	function Delta(U, UTargetPosition, data, addresses) {
	  this.U = U;
	  this.UTargetPosition = UTargetPosition;
	  this.data = data;
	  this.dataPosition = 0;
	  this.addresses = addresses;
	  this.addressesPosition = 0;
	  this.nearCache = new NearCache(4);
	  this.sameCache = new SameCache(3);
	}

	Delta.prototype.getNextAddressInteger = function() {
	  let value;
	  // get next address and increase the address position for the next address
	  ({value, position: this.addressesPosition } = deserializeInteger(this.addresses, this.addressesPosition));
	  return value;
	};

	Delta.prototype.getNextAddressByte = function() {
	  // get next address and increase the address position for the next address
	  let value = this.addresses[this.addressesPosition++];
	  return value;
	};

	module.exports = VCDiff;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	'use strict';

	function uint8ArrayToString(uintArray) {
	  let encodedString = String.fromCharCode.apply(null, uintArray);
	  let decodedString = decodeURIComponent(escape(encodedString));
	  return decodedString;
	}

	function stringToUint8Array(str) {
	  var buf = new Uint8Array(str.length);
	  for (var i=0, strLen=str.length; i < strLen; i++) {
	    buf[i] = str.charCodeAt(i);
	  }
	  return buf;
	}

	function equal(typedArray1, typedArray2) {
	  if (typedArray1.length !== typedArray2.length) {
	    return false;
	  }
	  for (let i = 0; i < typedArray1.length; i++) {
	    if (typedArray1[i] !== typedArray2[i]) {
	      return false;
	    }
	  }
	  return true;
	}

	function TypedArrayList() {
	  this.typedArrays = [];
	  this.startIndexes = [];
	  this.length = 0;
	}

	TypedArrayList.prototype.add = function(typedArray) {
	  let typedArrayTypes = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
	    Int32Array, Uint32Array, Float32Array, Float64Array];

	  let matchingTypedArrayTypes = typedArrayTypes.filter(typedArrayType => typedArray instanceof typedArrayType);
	  if (matchingTypedArrayTypes.length < 1) {
	    throw Error('Given ' + typeof typedArray + ' when expected a TypedArray');
	  }

	  let startIndex;
	  if (this.typedArrays.length === 0) {
	    startIndex = 0;
	  }
	  else {
	    let lastIndex = this.startIndexes.length - 1;
	    let lastStartIndex = this.startIndexes[lastIndex];
	    let lastLength = this.typedArrays[lastIndex].length;
	    startIndex = lastStartIndex + lastLength;
	  }

	  this.startIndexes.push(startIndex);
	  this.typedArrays.push(typedArray);
	  this.length += startIndex + typedArray.length;
	};

	TypedArrayList.prototype.get = function(index) {
	  let listIndex = getIndex(this.startIndexes, index);
	  let typedArray = index - this.startIndexes[listIndex];
	  return this.typedArrays[listIndex][typedArray];
	};

	TypedArrayList.prototype.set = function(index, value) {
	  if (typeof index !== 'number' || isNaN(index)) {
	    throw new Error('Given non-number index: ' + index);
	  }
	  //console.log(index);

	  let listIndex = getIndex(this.startIndexes, index);
	  let typedArrayIndex = index - this.startIndexes[listIndex];
	  this.typedArrays[listIndex][typedArrayIndex] = value;
	};

	function getIndex(arr, element) {
	  let low = 0;
	  let high = arr.length - 1;

	  while (low < high) {
	    let mid = Math.floor((low + high) / 2);

	    if (arr[mid] === element) {
	      return mid;
	    }
	    else if (arr[mid] < element) {
	      low = mid + 1;
	    }
	    else {
	      high = mid - 1;
	    }
	  }
	  if (arr[high] > element) {
	    return high - 1;
	  }
	  else {
	    return high;
	  }
	}

	module.exports = {
	  uint8ArrayToString,
	  stringToUint8Array,
	  equal,
	  TypedArrayList
	};



/***/ }),
/* 9 */
/***/ (function(module, exports) {

	'use strict';

	/**
	 * Converts RFC 3284 definition of integer in buffer to decimal
	 * Also returns the index of the byte after the integer
	 * @param buffer {Uint8Array}
	 * @param position {Number}
	 * @returns {{position: {Number}, value: {Number}}}
	 */
	function integer(buffer, position) {
	  let integer = buffer[position++];
	  let digitArray = [];

	  let numBytes = 0;

	  // if the most significant bit is set, the the integer continues
	  while (integer >= 128) {
	    digitArray.unshift(integer - 128);
	    integer = buffer[position++];
	    if (numBytes > 1000) {
	      throw new Error('Integer is probably too long')
	    }
	    numBytes++;
	  }

	  digitArray.unshift(integer);

	  // convert from base 128 to decimal
	  return {
	    position: position,
	    value: digitArray.reduce((sum, digit, index) => sum + digit * Math.pow(128, index), 0)
	  };
	}

	module.exports = integer;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	const errors = __webpack_require__(6);
	const deserializeInteger = __webpack_require__(9);
	const tokenizeInstructions = __webpack_require__(11);

	function delta(delta, position) {

	  let targetWindowLength, dataLength, instructionsLength, addressesLength;

	  // parentheses are needed for assignment destructuring
	  ({ value: targetWindowLength, position } = deserializeInteger(delta, position));

	  // Delta_Indicator byte
	  if (delta[position] !== 0) {
	    throw new errors.NotImplemented(
	      'VCD_DECOMPRESS is not supported, Delta_Indicator must be zero at byte ' + position + ' and not ' + delta[position]
	    );
	  }
	  position++;

	  ({ value: dataLength, position } = deserializeInteger(delta, position));
	  ({ value: instructionsLength, position } = deserializeInteger(delta, position));
	  ({ value: addressesLength, position } = deserializeInteger(delta, position));

	  let dataNextPosition = position + dataLength;
	  let data = delta.slice(position, dataNextPosition);

	  let instructionsNextPosition = dataNextPosition + instructionsLength;
	  let instructions = delta.slice(dataNextPosition, instructionsNextPosition);
	  let deserializedInstructions = tokenizeInstructions(instructions);

	  let addressesNextPosition = instructionsNextPosition + addressesLength;
	  let addresses = delta.slice(instructionsNextPosition, addressesNextPosition);

	  position = addressesNextPosition;

	  let window = {
	    targetWindowLength,
	    position,
	    data,
	    instructions: deserializedInstructions,
	    addresses
	  };

	  return window;
	}

	module.exports = delta;



/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	const instructions = __webpack_require__(12);
	const deserializeInteger = __webpack_require__(9);

	function tokenizeInstructions(instructionsBuffer) {
	  let deserializedInstructions = [];

	  let instructionsPosition = 0;

	  while (instructionsPosition < instructionsBuffer.length) {
	    let index = instructionsBuffer[instructionsPosition++];

	    let addSize, copySize, size;

	    if (index === 0) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.RUN(size));
	    }
	    else if (index === 1) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.ADD(size));
	    }
	    else if (index < 19) {
	      deserializedInstructions.push(new instructions.ADD(index - 1));
	    }
	    else if (index === 19) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 0));
	    }
	    else if (index < 35) {
	      deserializedInstructions.push(new instructions.COPY(index - 16, 0));
	    }
	    else if (index === 35) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 1));
	    }
	    else if (index < 51) {
	      deserializedInstructions.push(new instructions.COPY(index - 32, 1));
	    }
	    else if (index === 51) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 2));
	    }
	    else if (index < 67) {
	      deserializedInstructions.push(new instructions.COPY(index - 48, 2));
	    }
	    else if (index === 67) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 3));
	    }
	    else if (index < 83) {
	      deserializedInstructions.push(new instructions.COPY(index - 64, 3));
	    }
	    else if (index === 83) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 4));
	    }
	    else if (index < 99) {
	      deserializedInstructions.push(new instructions.COPY(index - 80, 4));
	    }
	    else if (index === 99) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 5));
	    }
	    else if (index < 115) {
	      deserializedInstructions.push(new instructions.COPY(index - 96, 5));
	    }
	    else if (index === 115) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 6));
	    }
	    else if (index < 131) {
	      deserializedInstructions.push(new instructions.COPY(index - 112, 6));
	    }
	    else if (index === 131) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 7));
	    }
	    else if (index < 147) {
	      deserializedInstructions.push(new instructions.COPY(index - 127, 7));
	    }
	    else if (index === 147) {
	      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
	      deserializedInstructions.push(new instructions.COPY(size, 8));
	    }
	    else if (index < 163) {
	      deserializedInstructions.push(new instructions.COPY(index - 144, 8));
	    }
	    else if (index < 175) {
	      ({addSize, copySize} = ADD_COPY(index, 163));

	      deserializedInstructions.push(new instructions.ADD(addSize));
	      deserializedInstructions.push(new instructions.COPY(copySize, 0));
	    }
	    else if (index < 187) {
	      ({addSize, copySize} = ADD_COPY(index, 175));

	      deserializedInstructions.push(new instructions.ADD(addSize));
	      deserializedInstructions.push(new instructions.COPY(copySize, 1));
	    }
	    else if (index < 199) {
	      ({addSize, copySize} = ADD_COPY(index, 187));

	      deserializedInstructions.push(new instructions.ADD(addSize));
	      deserializedInstructions.push(new instructions.COPY(copySize, 2));
	    }
	    else if (index < 211) {
	      ({addSize, copySize} = ADD_COPY(index, 199));

	      deserializedInstructions.push(new instructions.ADD(addSize));
	      deserializedInstructions.push(new instructions.COPY(copySize, 3));
	    }
	    else if (index < 223) {
	      ({addSize, copySize} = ADD_COPY(index, 211));

	      deserializedInstructions.push(new instructions.ADD(addSize));
	      deserializedInstructions.push(new instructions.COPY(copySize, 4));
	    }
	    else if (index < 235) {
	      ({addSize, copySize} = ADD_COPY(index, 223));

	      deserializedInstructions.push(new instructions.ADD(addSize));
	      deserializedInstructions.push(new instructions.COPY(copySize, 5));
	    }
	    else if (index < 239) {
	      deserializedInstructions.push(new instructions.ADD(index - 235 + 1));
	      deserializedInstructions.push(new instructions.COPY(4, 6));
	    }
	    else if (index < 243) {
	      deserializedInstructions.push(new instructions.ADD(index - 239 + 1));
	      deserializedInstructions.push(new instructions.COPY(4, 7));
	    }
	    else if (index < 247) {
	      deserializedInstructions.push(new instructions.ADD(index - 243 + 1));
	      deserializedInstructions.push(new instructions.COPY(4, 8));
	    }
	    else if (index < 256) {
	      deserializedInstructions.push(new instructions.COPY(4, index - 247));
	      deserializedInstructions.push(new instructions.ADD(1));
	    }
	    else {
	      throw new Error('Should not get here');
	    }
	  }

	  return deserializedInstructions;
	}

	function ADD_COPY(index, baseIndex) {
	  let zeroBased = index - baseIndex;

	  // 0,1,2 -> 0   3,4,5 -> 1   etc.
	  let addSizeIndex = Math.floor(zeroBased / 3);
	  // offset so size starts at 1
	  let addSize = addSizeIndex + 1;

	  // rotate through 0, 1, and 2
	  let copySizeIndex = zeroBased % 3;
	  // offset so size starts at 4
	  let copySize = copySizeIndex + 4;

	  return [addSize, copySize];
	}

	module.exports = tokenizeInstructions;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	const deserializeInteger = __webpack_require__(9);
	const TypedArray = __webpack_require__(8);

	function ADD(size) {
	  this.size = size;
	}
	function COPY(size, mode) {
	  this.size = size;
	  this.mode = mode;
	}
	function RUN(size) {
	  this.size = size;
	}

	ADD.prototype.name = 'ADD';
	COPY.prototype.name = 'COPY';
	RUN.prototype.name = 'RUN';

	ADD.prototype.execute = function(delta) {
	  for (let i = 0; i < this.size; i++) {
	    delta.U.set(delta.UTargetPosition + i, delta.data[delta.dataPosition + i]);
	  }
	  delta.dataPosition += this.size;
	  delta.UTargetPosition += this.size;
	};

	COPY.prototype.execute = function(delta) {
	  let address, m, next, method;

	  if (this.mode === 0) {
	    address = delta.getNextAddressInteger();
	  }
	  else if (this.mode === 1) {
	    next = delta.getNextAddressInteger();
	    address = delta.UTargetPosition - next;
	  }
	  else if ((m = this.mode - 2) >= 0 && (m < delta.nearCache.size)) {
	    next = delta.getNextAddressInteger();
	    address = delta.nearCache.get(m, next);
	    method = 'near';
	  }
	  // same cache
	  else {
	    m = this.mode - (2 + delta.nearCache.size);
	    next = delta.getNextAddressByte();
	    address = delta.sameCache.get(m, next);
	    method = 'same';
	  }

	  delta.nearCache.update(address);
	  delta.sameCache.update(address);

	  for (let i = 0; i < this.size; i++) {
	    delta.U.set(delta.UTargetPosition + i, delta.U.get(address + i));
	  }

	  delta.UTargetPosition += this.size;
	};

	RUN.prototype.execute = function(delta) {
	  for (let i = 0; i < this.size; i++) {
	    // repeat single byte
	    delta.U[delta.UTargetPosition + i] = delta.data[delta.dataPosition];
	  }
	  // increment to next byte
	  delta.dataPosition++;
	  delta.UTargetPosition += this.size;
	};

	let instructions = {
	  ADD,
	  COPY,
	  RUN
	};

	module.exports = instructions;

/***/ }),
/* 13 */
/***/ (function(module, exports) {

	'use strict';

	function NearCache(size) {
	  this.size = size;
	  this.near = new Array(this.size).fill(0);
	  this.nextSlot = 0;
	}

	NearCache.prototype.update = function(address) {
	  if (this.near.length > 0) {
	    this.near[this.nextSlot] = address;
	    this.nextSlot = (this.nextSlot + 1) % this.near.length;
	  }
	};

	NearCache.prototype.get = function(m, offset) {
	  let address = this.near[m] + offset;
	  return address;
	};

	module.exports = NearCache;

/***/ }),
/* 14 */
/***/ (function(module, exports) {

	'use strict';

	function SameCache(size) {
	  this.size = size;
	  this.same = new Array(this.size * 256).fill(0);
	}

	SameCache.prototype.update = function(address) {
	  if (this.same.length > 0) {
	    this.same[address % (this.size * 256)] = address;
	  }
	};

	SameCache.prototype.get = function(m, offset) {
	  let address = this.same[m * 256 + offset];
	  return address;
	};

	module.exports = SameCache;

/***/ })
/******/ ]);
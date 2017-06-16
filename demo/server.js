'use strict';

const http = require('http');
const fs = require('fs');

const express = require('express');
const createDeltaCache = require('delta-cache');

const deltaCache = createDeltaCache();

const app = express();
app.use(express.static(__dirname + '/public'));

const text = fs.readFileSync(__dirname + '/sample_text/loremipsum.html')

// use delta encoding (when possible)
app.get('/deltaEncodedContent', (req, res) => {
  const time = new Buffer(new Date().toTimeString())
  const dynamicText = Buffer.concat([time, text])
  deltaCache.respondWithDeltaEncoding(req, res, dynamicText);
});

// no delta encoding
app.get('/normalContent', (req, res) => {
  const time = new Buffer(new Date().toTimeString())
  const dynamicText = Buffer.concat([time, text])
  res.end(dynamicText)
});

const server = app.listen(4555, (err) => {
  console.log('Demo running on port 4555')
});

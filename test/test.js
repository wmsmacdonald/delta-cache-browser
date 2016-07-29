'use strict';

const https = require('https');
const fs = require('fs');

const express = require('express');
const DeltaCache = require('delta-cache-express');
const open = require('open');

let deltaCache = DeltaCache();

let app = express();
app.use(express.static('test/public'));

app.use('/dynamicContent', (req, res, next) => {
  res.local.responseBody = new Date.toString();
  next();
}, deltaCache);

let options = {
  key: fs.readFileSync('./ssl/test_key.pem'),
  cert: fs.readFileSync('./ssl/test_cert.pem')
};

let server = https.createServer(options, app).listen(8080, () => {
  open('https://localhost:8080/test.html');
});
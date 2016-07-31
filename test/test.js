'use strict';

const http = require('http');
const fs = require('fs');

const express = require('express');
const DeltaCache = require('delta-cache-express');
const open = require('open');

let deltaCache = DeltaCache();

let app = express();
app.use(express.static('test/public'));

let tick = true;
app.get('/dynamicContent', (req, res, next) => {
  if (tick) {
    res.locals.responseBody = 'version 1';
    tick = false;
  }
  else {
    res.locals.responseBody = 'version 2';
    tick = true;
  }
  console.log(req.url, res.locals.responseBody);
  next();
}, deltaCache);

app.get('/staticContent', (req, res, next) => {
  res.locals.responseBody = 'single response';
  console.log(req.url, res.locals.responseBody);
  next();
}, deltaCache);

/*let options = {
  key: fs.readFileSync('./ssl/test_key.pem'),
  cert: fs.readFileSync('./ssl/test_cert.pem')
};*/

let server = app.listen(8080, (err) => {
  open('http://localhost:8080/test.html');
});
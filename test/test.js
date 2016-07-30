'use strict';

const http = require('http');
const fs = require('fs');

const express = require('express');
const DeltaCache = require('delta-cache-express');
const open = require('open');

let deltaCache = DeltaCache();

let app = express();
app.use(express.static('test/public'));

app.get('/dynamicContent', (req, res, next) => {
  res.locals.responseBody = new Date().toString();
  next();
}, deltaCache);

/*let options = {
  key: fs.readFileSync('./ssl/test_key.pem'),
  cert: fs.readFileSync('./ssl/test_cert.pem')
};*/

let server = app.listen(8080, (err) => {
  //open('http://localhost:8080/test.html');
});
'use strict';

const http = require('http');
const fs = require('fs');

const express = require('express');
const DeltaCache = require('delta-cache-express');
const open = require('open');

let deltaCache = new DeltaCache();

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
  console.log('GET', req.url);
  console.log(res.locals.responseBody);
  next();
}, deltaCache);

app.get('/staticContent', (req, res, next) => {
  res.locals.responseBody = 'single response';
  console.log('GET', req.url);
  console.log(res.locals.responseBody);
  next();
}, deltaCache);

app.get('/noDelta', (req, res) => {
  console.log('GET', req.url);
  console.log('single response');
  res.send('single response');
});


let server = app.listen(8080, (err) => {
  open('http://localhost:8080/test.html');
});
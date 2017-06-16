'use strict';

const http = require('http');
const fs = require('fs');

const express = require('express');
const createDeltaCache = require('delta-cache');
const open = require('open');

const deltaCache = createDeltaCache();

const app = express();
app.use(express.static('test/public'));

let first = true;
app.get('/dynamicContent', (req, res) => {
  console.log('GET', req.url);
  if (first) {
    res.locals.responseBody = 'version 1';
    first = false;
    console.log(res.locals.responseBody);
    deltaCache.respondWithDeltaEncoding(req, res, res.locals.responseBody);
  }
  else {
    res.locals.responseBody = 'version 2';
    console.log(res.locals.responseBody);
    deltaCache.respondWithDeltaEncoding(req, res, res.locals.responseBody, () => {
      process.exit()
    });
  }
});

app.get('/staticContent', (req, res) => {
  res.locals.responseBody = 'single response';
  console.log('GET', req.url);
  console.log(res.locals.responseBody);
  deltaCache.respondWithDeltaEncoding(req, res, res.locals.responseBody);
});

app.get('/noDelta', (req, res) => {
  console.log('GET', req.url);
  console.log('single response');
  res.send('single response');
});

app.listen(8080, (err) => {
  open('http://localhost:8080/test.html');
});

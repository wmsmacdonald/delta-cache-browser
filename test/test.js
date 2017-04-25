'use strict';

const http = require('http');
const fs = require('fs');

const express = require('express');
const createDeltaCache = require('delta-cache');
const open = require('open');

const deltaCache = createDeltaCache();

const app = express();
app.use(express.static('test/public'));

let tick = true;
app.get('/dynamicContent', (req, res) => {
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
  deltaCache(req, res, res.locals.responseBody);
});

app.get('/staticContent', (req, res) => {
  res.locals.responseBody = 'single response';
  console.log('GET', req.url);
  console.log(res.locals.responseBody);
  deltaCache(req, res, res.locals.responseBody);
});

app.get('/noDelta', (req, res) => {
  console.log('GET', req.url);
  console.log('single response');
  res.send('single response');
});

app.get('/dynamicPage', (req, res) => {
  res.locals.responseBody = new Date().toString();
  deltaCache(req, res, res.locals.responseBody);
});


let server = app.listen(8080, (err) => {
  open('http://localhost:8080/test.html');
});

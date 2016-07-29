'use strict';

const express = require('express');
const open = require('open');
const https = require('https');
const fs = require('fs');

let app = express();
app.use(express.static('test/public'));

let options = {
  key: fs.readFileSync('./ssl/test_key.pem'),
  cert: fs.readFileSync('./ssl/test_cert.pem')
};

let server = https.createServer(options, app).listen(8080, () => {
  open('https://localhost:8080/test.html');
});
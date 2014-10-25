#!/usr/bin/env node

'use strict';

var HTTP_PORT = 8001;

var Promise = require('bluebird');
var request = require('request');
var http_server = require("http-server");
var fs = require('fs');
var indexfile = "./test/test.js";
var dotfile = "./test/.test-bundle.js";
var outfile = "./test/test-bundle.js";
var watchify = require("watchify");
var w = watchify(indexfile);

w.on('update', bundle);
bundle();

var filesWritten = false;
var serverStarted = false;
var readyCallback;

function bundle() {
  var wb = w.bundle();
  wb.on('error', function (err) {
    console.error(String(err));
  });
  wb.on("end", end);
  wb.pipe(fs.createWriteStream(dotfile));

  function end() {
    fs.rename(dotfile, outfile, function (err) {
      if (err) { return console.error(err); }
      console.log('Updated:', outfile);
      filesWritten = true;
      checkReady();
    });
  }
}

function startServers(callback) {
  readyCallback = callback;

  Promise.resolve().then(function () {
    return http_server.createServer().listen(HTTP_PORT);
  }).then(function () {
    console.log('Tests: http://127.0.0.1:' + HTTP_PORT + '/test/index.html');
    serverStarted = true;
    checkReady();
  }).catch(function (err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
}

function checkReady() {
  if (filesWritten && serverStarted && readyCallback) {
    readyCallback();
  }
}

if (require.main === module) {
  startServers();
} else {
  module.exports.start = startServers;
}

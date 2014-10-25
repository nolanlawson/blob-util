/*jshint expr:true */
'use strict';

var blobUtil = require('..');

var chai = require('chai');
chai.use(require("chai-as-promised"));

var should = chai.should(); // var should = chai.should();
var Promise = require('bluebird'); // var Promise = require('bluebird');

tests();

function tests() {

  beforeEach(function () {
  });
  afterEach(function () {
  });
  describe('basic tests', function () {
    it('convert plain blobs', function () {
      var blob = blobUtil.plainTextToBlob('foo');
      blob.type.should.equal('text/plain');
      return blobUtil.blobToBase64String(blob).then(function (base64) {
        base64.should.equal('Zm9v');
      });
    });

    it('convert regular gif', function () {
      var img = document.getElementById('kirby');
      return blobUtil.imgSrcToBlob(img.src).then(function (blob) {
        blob.type.should.equal('image/png');
        return blobUtil.blobToBase64String(blob).then(function (base64) {
          should.exist(base64);
        });
      });
    });

    it('convert regular gif as jpeg', function () {
      var img = document.getElementById('kirby');
      return blobUtil.imgSrcToBlob(img.src, 'image/jpeg').then(function (blob) {
        blob.type.should.equal('image/jpeg');
        return blobUtil.blobToBase64String(blob).then(function (base64) {
          should.exist(base64);
        });
      });
    });

    it('convert regular gif to canvas and back', function () {
      var img = document.getElementById('kirby');
      return blobUtil.imgSrcToBlob(img.src).then(function (blob) {
        blob.type.should.equal('image/png');

        var url = blobUtil.createObjectURL(blob);
        return blobUtil.imgSrcToBlob(url).then(function (otherBlob) {
          return Promise.all([
            blobUtil.blobToBase64String(blob),
            blobUtil.blobToBase64String(otherBlob)
          ]).then(function (strings) {
            strings[0].should.equal(strings[1]);
          })
        });
      });
    });
  });
}

'use strict';

var utils = require('./utils');
var blob = require('blob');
var Promise = utils.Promise;

function createBlob(parts, opts) {
  return blob(parts, opts);
}

// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
function binaryStringToArrayBuffer(bin) {
  var length = bin.length;
  var buf = new ArrayBuffer(length);
  var arr = new Uint8Array(buf);
  var i = -1;
  while (++i < length) {
    arr[i] = bin.charCodeAt(i);
  }
  return buf;
}

// Can't find original post, but this is close
// http://stackoverflow.com/questions/6965107/ (continues on next line)
// converting-between-strings-and-arraybuffers
function arrayBufferToBinaryString(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var length = bytes.byteLength;
  var i = -1;
  while (++i < length) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

// shim for browsers that don't support it
function blobToBinaryString(blob) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    var hasBinaryString = typeof reader.readAsBinaryString === 'function';
    reader.onloadend = function (e) {
      var result = e.target.result || '';
      if (hasBinaryString) {
        return resolve(result);
      }
      resolve(arrayBufferToBinaryString(result));
    };
    reader.onerror = reject;
    if (hasBinaryString) {
      reader.readAsBinaryString(blob);
    } else {
      reader.readAsArrayBuffer(blob);
    }
  });
}

function base64StringToBlob(base64, type) {
  return Promise.resolve().then(function () {
    var parts = [binaryStringToArrayBuffer(atob(base64))];
    return type ? createBlob(parts, {type: type}) : createBlob(parts);
  });
}

function blobToBase64String(blob) {
  return blobToBinaryString(blob).then(function (binary) {
    return btoa(binary);
  });
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();

    img.onload = function () {
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function dataURLToBlob(dataURL) {
  var type = dataURL.match(/data:([^;]+)/)[1];
  var base64 = dataURL.replace(/^[^,]+,/, '');

  return createBlob([binaryStringToArrayBuffer(atob(base64))], {type: type});
}

function createObjectURL(blob) {
  var compatURL = window.URL || window.webkitURL;
  return compatURL.createObjectURL(blob);
}

function revokeObjectURL(url) {
  var compatURL = window.URL || window.webkitURL;
  return compatURL.revokeObjectURL(url);
}

function imgToCanvas(img) {
  var canvas = document.createElement('canvas');

  canvas.width = img.width;
  canvas.height = img.height;

  // copy the image contents to the canvas
  var context = canvas.getContext('2d');
  context.drawImage(
    img,
    0, 0,
    img.width, img.height,
    0, 0,
    img.width, img.height);

  return canvas;
}

function imgSrcToDataURL(src, type) {
  type = type || 'image/jpeg';

  return loadImage(src).then(function (img) {
    return imgToCanvas(img);
  }).then(function (canvas) {
    return canvas.toDataURL(type);
  });
}

function imgSrcToBlob(src, type) {
  type = type || 'image/jpeg';

  return loadImage(src).then(function (img) {
    return imgToCanvas(img);
  }).then(function (canvas) {
    if (typeof canvas.toBlob === 'function') {
      return new Promise(function (resolve) {
        canvas.toBlob(type, resolve);
      });
    }
    return dataURLToBlob(canvas.toDataURL(type));
  });
}

module.exports = {
  createBlob         : createBlob,
  createObjectURL    : createObjectURL,
  revokeObjectURL    : revokeObjectURL,
  imgSrcToBlob       : imgSrcToBlob,
  imgSrcToDataURL    : imgSrcToDataURL,
  dataURLToBlob      : dataURLToBlob,
  blobToBase64String : blobToBase64String,
  base64StringToBlob : base64StringToBlob
};
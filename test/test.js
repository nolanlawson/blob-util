'use strict';

var blobUtil = require('../lib');

var chai = require('chai');
chai.use(require("chai-as-promised"));

var should = chai.should();
var Promise = require('native-or-lie');

var transparent1x1Png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAg' +
  'cBApocMXEAAAAASUVORK5CYII=';
var black1x1Png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABg' +
  'ADNjd8qAAAAABJRU5ErkJggg==';

describe('basic tests', function () {
  this.timeout(30000);

  before(function () {
    var img = document.createElement('img');
    img.src = 'test/kirby.gif';
    img.id = 'kirby';
    document.body.appendChild(img);

    var transparent = document.createElement('img');
    transparent.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUh' +
      'EUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAgcBApocMXEA' +
      'AAAASUVORK5CYII=';
    transparent.id = 'transparent';
    document.body.appendChild(transparent);
  });


  it('convert plain blobs', function () {
    var blob = blobUtil.createBlob(['foo'], 'text/plain');
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
        });
      });
    });
  });

  it('convert base64 to png', function () {
    return blobUtil.base64StringToBlob(transparent1x1Png, 'image/png').then(function (blob) {
      return blobUtil.blobToBase64String(blob);
    }).then(function (string) {
      string.should.equal(transparent1x1Png);
    });
  });

  it('convert base64 to png 2', function () {
    return blobUtil.base64StringToBlob(black1x1Png, 'image/png').then(function (blob) {
      return blobUtil.blobToBase64String(blob);
    }).then(function (string) {
        string.should.equal(black1x1Png);
      });
  });

  it('convert data url', function () {
    var dataURL = 'data:image/png;base64,' + transparent1x1Png;
    return blobUtil.dataURLToBlob(dataURL).then(function (blob) {
      return blobUtil.blobToBase64String(blob);
    }).then(function (string) {
      string.should.equal(transparent1x1Png);
    });
  });

  it('convert blob to data url', function () {
    var blob = blobUtil.createBlob(['foo'], 'text/plain');
    return blobUtil.blobToDataURL(blob).then(function (dataURL) {
      dataURL.should.equal('data:text/plain;base64,Zm9v');
    });
  });

  it('convert img to dataURL', function () {
    var img = document.getElementById('transparent');
    return blobUtil.imgSrcToDataURL(img.src).then(function (url) {
      url.should.match(/^data:image\/png;base64/);
    });
  });

  it('convert img to dataURL 2', function () {
    var img = document.getElementById('kirby');
    return blobUtil.imgSrcToDataURL(img.src).then(function (url) {
      url.should.match(/^data:image\/png;base64/);
    });
  });

  it('convert img to dataURL 3', function () {
    var img = document.getElementById('kirby');
    return blobUtil.imgSrcToDataURL(img.src, 'image/jpeg').then(function (url) {
      url.should.match(/^data:image\/jpeg;base64/);
    });
  });

  it('convert to binary and back', function () {
    var binary = atob(transparent1x1Png);
    return blobUtil.binaryStringToBlob(binary, 'image/png').then(function (blob) {
      blob.size.should.equal(68);
      return blobUtil.blobToBase64String(blob).then(function (base64) {
        base64.should.equal(transparent1x1Png);
        return blobUtil.blobToBinaryString(blob);
      }).then(function (bin) {
        bin.should.equal(atob(transparent1x1Png));
      });
    });
  });

  it('convert to array buffer and back', function () {
    var bin = atob(transparent1x1Png);
    var buffer = new ArrayBuffer(bin.length);
    var arr = new Uint8Array(buffer);
    for (var i = 0; i < bin.length; i++) {
      arr[i] = bin.charCodeAt(i);
    }
    return blobUtil.arrayBufferToBlob(buffer, 'image/png').then(function (blob) {
      blob.size.should.equal(68);
      return blobUtil.blobToBase64String(blob).then(function (base64) {
        base64.should.equal(transparent1x1Png);
        return blobUtil.blobToBinaryString(blob);
      }).then(function (bin) {
        bin.should.equal(atob(transparent1x1Png));
        return blobUtil.blobToArrayBuffer(blob);
      }).then(function (buff) {
        buff.byteLength.should.equal(68);
        return blobUtil.arrayBufferToBlob(buff, 'image/png');
      }).then(function (blob) {
        return blobUtil.blobToBase64String(blob);
      }).then(function (base64) {
        base64.should.equal(transparent1x1Png);
      });
    });
  });

  it('convert with specific quality', function () {
    var img = document.getElementById('kirby');
    return blobUtil.imgSrcToBlob(img.src, 'image/jpeg', undefined, 1).then(function (blob) {
      return blobUtil.imgSrcToBlob(img.src, 'image/jpeg', undefined, 0.5).then(function (lowQualityBlob) {
        lowQualityBlob.size.should.be.lessThan(blob.size);
      });
    });
  });
});

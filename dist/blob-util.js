(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.blobUtil = {})));
}(this, (function (exports) { 'use strict';

  // doesn't download the image more than once, because
  // browsers aren't dumb. uses the cache
  function loadImage(src, crossOrigin) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }
      img.onload = function () {
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
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

  /**
   * Convert a binary string to an array buffer.
   * @param {string} binary - binary string
   * @returns {ArrayBuffer}
   */
  function binaryStringToArrayBuffer(binary) {
    var length = binary.length;
    var buf = new ArrayBuffer(length);
    var arr = new Uint8Array(buf);
    var i = -1;
    while (++i < length) {
      arr[i] = binary.charCodeAt(i);
    }
    return buf;
  }

  /**
   * Convert an array buffer to a binary string
   * @param {ArrayBuffer} buffer - array buffer
   * @returns {string}
   */
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

  /**
   * Shim for
   * [new Blob()]{@link https://developer.mozilla.org/en-US/docs/Web/API/Blob.Blob}
   * to support
   * [older browsers that use the deprecated <code>BlobBuilder</code> API]{@link http://caniuse.com/blob}.
   *
   * @param {Array} parts - content of the <code>Blob</code>
   * @param {Object} options - usually just <code>{type: myContentType}</code>, you can also pass a string here for contentType
   * @returns {Blob}
   */
  function createBlob (parts, properties) {
    /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
    parts = parts || [];
    properties = properties || {};
    if (typeof properties === 'string') {
      properties = {type: properties}; // infer content type
    }
    try {
      return new Blob(parts, properties)
    } catch (e) {
      if (e.name !== 'TypeError') {
        throw e
      }
      var Builder = typeof BlobBuilder !== 'undefined'
        ? BlobBuilder : typeof MSBlobBuilder !== 'undefined'
        ? MSBlobBuilder : typeof MozBlobBuilder !== 'undefined'
        ? MozBlobBuilder : WebKitBlobBuilder;
      var builder = new Builder();
      for (var i = 0; i < parts.length; i += 1) {
        builder.append(parts[i]);
      }
      return builder.getBlob(properties.type)
    }
  }

  /**
   * Shim for
   * [URL.createObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL}
   * to support browsers that only have the prefixed
   * <code>webkitURL</code> (e.g. Android <4.4).
   * @param {Blob} blob
   * @returns {string} url
   */
  function createObjectURL(blob) {
    return (window.URL || window.webkitURL).createObjectURL(blob);
  }

  /**
   * Shim for
   * [URL.revokeObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.revokeObjectURL}
   * to support browsers that only have the prefixed
   * <code>webkitURL</code> (e.g. Android <4.4).
   * @param {string} url
   */
  function revokeObjectURL(url) {
    return (window.URL || window.webkitURL).revokeObjectURL(url);
  }

  /**
   * Convert a <code>Blob</code> to a binary string. Returns a Promise.
   *
   * @param {Blob} blob
   * @returns {Promise} Promise that resolves with the binary string
   */
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

  /**
   * Convert a base64-encoded string to a <code>Blob</code>. Returns a Promise.
   * @param {string} base64
   * @param {string|undefined} type - the content type (optional)
   * @returns {Promise} Promise that resolves with the <code>Blob</code>
   */
  function base64StringToBlob(base64, type) {
    return Promise.resolve().then(function () {
      var parts = [binaryStringToArrayBuffer(atob(base64))];
      return type ? createBlob(parts, {type: type}) : createBlob(parts);
    });
  }

  /**
   * Convert a binary string to a <code>Blob</code>. Returns a Promise.
   * @param {string} binary
   * @param {string|undefined} type - the content type (optional)
   * @returns {Promise} Promise that resolves with the <code>Blob</code>
   */
  function binaryStringToBlob(binary, type) {
    return Promise.resolve().then(function () {
      return base64StringToBlob(btoa(binary), type);
    });
  }

  /**
   * Convert a <code>Blob</code> to a binary string. Returns a Promise.
   * @param {Blob} blob
   * @returns {Promise} Promise that resolves with the binary string
   */
  function blobToBase64String(blob) {
    return blobToBinaryString(blob).then(function (binary) {
      return btoa(binary);
    });
  }

  /**
   * Convert a data URL string
   * (e.g. <code>'data:image/png;base64,iVBORw0KG...'</code>)
   * to a <code>Blob</code>. Returns a Promise.
   * @param {string} dataURL
   * @returns {Promise} Promise that resolves with the <code>Blob</code>
   */
  function dataURLToBlob(dataURL) {
    return Promise.resolve().then(function () {
      var type = dataURL.match(/data:([^;]+)/)[1];
      var base64 = dataURL.replace(/^[^,]+,/, '');

      var buff = binaryStringToArrayBuffer(atob(base64));
      return createBlob([buff], {type: type});
    });
  }

  /**
   * Convert a <code>Blob</code> to a data URL string
   * (e.g. <code>'data:image/png;base64,iVBORw0KG...'</code>).
   * Returns a Promise.
   * @param {Blob} blob
   * @returns {Promise} Promise that resolves with the data URL string
   */
  function blobToDataURL(blob) {
    return blobToBase64String(blob).then(function (base64String) {
      return 'data:' + blob.type + ';base64,' + base64String;
    });
  }

  /**
   * Convert an image's <code>src</code> URL to a data URL by loading the image and painting
   * it to a <code>canvas</code>. Returns a Promise.
   *
   * <p/>Note: this will coerce the image to the desired content type, and it
   * will only paint the first frame of an animated GIF.
   *
   * @param {string} src
   * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
   * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
   *                                         'Anonymous' to avoid "tainted canvas" errors
   * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
   *                                     if the requested type is 'image/jpeg' or 'image/webp'
   * @returns {Promise} Promise that resolves with the data URL string
   */
  function imgSrcToDataURL(src, type, crossOrigin, quality) {
    type = type || 'image/png';

    return loadImage(src, crossOrigin).then(function (img) {
      return imgToCanvas(img);
    }).then(function (canvas) {
      return canvas.toDataURL(type, quality);
    });
  }

  /**
   * Convert a <code>canvas</code> to a <code>Blob</code>. Returns a Promise.
   * @param {string} canvas
   * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
   * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
   *                                     if the requested type is 'image/jpeg' or 'image/webp'
   * @returns {Promise} Promise that resolves with the <code>Blob</code>
   */
  function canvasToBlob(canvas, type, quality) {
    return Promise.resolve().then(function () {
      if (typeof canvas.toBlob === 'function') {
        return new Promise(function (resolve) {
          canvas.toBlob(resolve, type, quality);
        });
      }
      return dataURLToBlob(canvas.toDataURL(type, quality));
    });
  }

  /**
   * Convert an image's <code>src</code> URL to a <code>Blob</code> by loading the image and painting
   * it to a <code>canvas</code>. Returns a Promise.
   *
   * <p/>Note: this will coerce the image to the desired content type, and it
   * will only paint the first frame of an animated GIF.
   *
   * @param {string} src
   * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
   * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
   *                                         'Anonymous' to avoid "tainted canvas" errors
   * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
   *                                     if the requested type is 'image/jpeg' or 'image/webp'
   * @returns {Promise} Promise that resolves with the <code>Blob</code>
   */
  function imgSrcToBlob(src, type, crossOrigin, quality) {
    type = type || 'image/png';

    return loadImage(src, crossOrigin).then(function (img) {
      return imgToCanvas(img);
    }).then(function (canvas) {
      return canvasToBlob(canvas, type, quality);
    });
  }

  /**
   * Convert an <code>ArrayBuffer</code> to a <code>Blob</code>. Returns a Promise.
   *
   * @param {ArrayBuffer} buffer
   * @param {string|undefined} type - the content type (optional)
   * @returns {Promise} Promise that resolves with the <code>Blob</code>
   */
  function arrayBufferToBlob(buffer, type) {
    return Promise.resolve().then(function () {
      return createBlob([buffer], type);
    });
  }

  /**
   * Convert a <code>Blob</code> to an <code>ArrayBuffer</code>. Returns a Promise.
   * @param {Blob} blob
   * @returns {Promise} Promise that resolves with the <code>ArrayBuffer</code>
   */
  function blobToArrayBuffer(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function (e) {
        var result = e.target.result || new ArrayBuffer(0);
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  exports.binaryStringToArrayBuffer = binaryStringToArrayBuffer;
  exports.arrayBufferToBinaryString = arrayBufferToBinaryString;
  exports.createBlob = createBlob;
  exports.createObjectURL = createObjectURL;
  exports.revokeObjectURL = revokeObjectURL;
  exports.blobToBinaryString = blobToBinaryString;
  exports.base64StringToBlob = base64StringToBlob;
  exports.binaryStringToBlob = binaryStringToBlob;
  exports.blobToBase64String = blobToBase64String;
  exports.dataURLToBlob = dataURLToBlob;
  exports.blobToDataURL = blobToDataURL;
  exports.imgSrcToDataURL = imgSrcToDataURL;
  exports.canvasToBlob = canvasToBlob;
  exports.imgSrcToBlob = imgSrcToBlob;
  exports.arrayBufferToBlob = arrayBufferToBlob;
  exports.blobToArrayBuffer = blobToArrayBuffer;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

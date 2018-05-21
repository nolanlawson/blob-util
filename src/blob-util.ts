/* global Promise, Image, Blob, FileReader, atob, btoa,
   BlobBuilder, MSBlobBuilder, MozBlobBuilder, WebKitBlobBuilder, webkitURL */
/* exported createObjectURL, revokeObjectURL, binaryStringToBlob, blobToDataURL,
   imgSrcToDataURL, imgSrcToBlob, arrayBufferToBlob, blobToArrayBuffer */

declare var BlobBuilder: any
declare var MozBlobBuilder: any
declare var MSBlobBuilder: any
declare var WebKitBlobBuilder: any
declare var webkitURL: any

function loadImage (src, crossOrigin) {
  return new Promise(function (resolve, reject) {
    var img = new Image()
    if (crossOrigin) {
      img.crossOrigin = crossOrigin
    }
    img.onload = function () {
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

function imgToCanvas (img) {
  var canvas = document.createElement('canvas')

  canvas.width = img.width
  canvas.height = img.height

  // copy the image contents to the canvas
  var context = canvas.getContext('2d')
  context.drawImage(
    img,
    0, 0,
    img.width, img.height,
    0, 0,
    img.width, img.height)

  return canvas
}

/**
 * Convert a binary string to an <code>ArrayBuffer</code>.
 * @param binary - binary string
 * @returns array buffer
 */
export function binaryStringToArrayBuffer (binary: string): ArrayBuffer {
  var length = binary.length
  var buf = new ArrayBuffer(length)
  var arr = new Uint8Array(buf)
  var i = -1
  while (++i < length) {
    arr[i] = binary.charCodeAt(i)
  }
  return buf
}

/**
 * Convert an <code>ArrayBuffer</code> to a binary string.
 * @param buffer - array buffer
 * @returns binary string
 */
export function arrayBufferToBinaryString (buffer: ArrayBuffer): string {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var length = bytes.byteLength
  var i = -1
  while (++i < length) {
    binary += String.fromCharCode(bytes[i])
  }
  return binary
}

/**
 * Shim for
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob.Blob | <code>new Blob()</code>}
 * to support
 * {@link http://caniuse.com/blob | older browsers that use the deprecated <code>BlobBuilder</code> API}.
 *
 * @param parts - content of the <code>Blob</code>
 * @param properties - usually <code>{type: myContentType}</code>,
 *                           you can also pass a string for the content type
 * @returns Blob
 */
export function createBlob (parts: Array<any>, properties?: BlobPropertyBag | string): Blob {
  parts = parts || []
  properties = properties || {}
  if (typeof properties === 'string') {
    properties = { type: properties } // infer content type
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
      ? MozBlobBuilder : WebKitBlobBuilder
    var builder = new Builder()
    for (var i = 0; i < parts.length; i += 1) {
      builder.append(parts[i])
    }
    return builder.getBlob(properties.type)
  }
}

/**
 * Shim for
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL | <code>URL.createObjectURL()</code>}
 * to support browsers that only have the prefixed
 * <code>webkitURL</code> (e.g. Android <4.4).
 * @param blob
 * @returns url
 */
export function createObjectURL (blob: Blob): string {
  return (typeof URL !== 'undefined' ? URL : webkitURL).createObjectURL(blob)
}

/**
 * Shim for
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/URL.revokeObjectURL | <code>URL.revokeObjectURL()</code>}
 * to support browsers that only have the prefixed
 * <code>webkitURL</code> (e.g. Android <4.4).
 * @param url
 */
export function revokeObjectURL (url: string): void {
  return (typeof URL !== 'undefined' ? URL : webkitURL).revokeObjectURL(url)
}

/**
 * Convert a <code>Blob</code> to a binary string.
 *
 * @param blob
 * @returns Promise that resolves with the binary string
 */
export function blobToBinaryString (blob: Blob): Promise<string> {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    var hasBinaryString = typeof reader.readAsBinaryString === 'function'
    reader.onloadend = function (e) {
      var result = e.target.result || ''
      if (hasBinaryString) {
        return resolve(result)
      }
      resolve(arrayBufferToBinaryString(result))
    }
    reader.onerror = reject
    if (hasBinaryString) {
      reader.readAsBinaryString(blob)
    } else {
      reader.readAsArrayBuffer(blob)
    }
  })
}

/**
 * Convert a base64-encoded string to a <code>Blob</code>.
 * @param base64 - base64-encoded string
 * @param type - the content type (optional)
 * @returns Blob
 */
export function base64StringToBlob (base64: string, type?: string): Blob {
  var parts = [binaryStringToArrayBuffer(atob(base64))]
  return type ? createBlob(parts, { type: type }) : createBlob(parts)
}

/**
 * Convert a binary string to a <code>Blob</code>.
 * @param binary - binary string
 * @param type - the content type (optional)
 * @returns Blob
 */
export function binaryStringToBlob (binary: string, type?: string): Blob {
  return base64StringToBlob(btoa(binary), type)
}

/**
 * Convert a <code>Blob</code> to a binary string.
 * @param blob
 * @returns Promise that resolves with the binary string
 */
export function blobToBase64String (blob: Blob): Promise<string> {
  return blobToBinaryString(blob).then(btoa)
}

/**
 * Convert a data URL string
 * (e.g. <code>'data:image/png;base64,iVBORw0KG...'</code>)
 * to a <code>Blob</code>.
 * @param dataURL - dataURL-encoded string
 * @returns Blob
 */
export function dataURLToBlob (dataURL: string): Blob {
  var type = dataURL.match(/data:([^;]+)/)[1]
  var base64 = dataURL.replace(/^[^,]+,/, '')

  var buff = binaryStringToArrayBuffer(atob(base64))
  return createBlob([buff], { type: type })
}

/**
 * Convert a <code>Blob</code> to a data URL string
 * (e.g. <code>'data:image/png;base64,iVBORw0KG...'</code>).
 * @param blob
 * @returns Promise that resolves with the data URL string
 */
export function blobToDataURL (blob: Blob): Promise<string> {
  return blobToBase64String(blob).then(function (base64String) {
    return 'data:' + blob.type + ';base64,' + base64String
  })
}

/**
 * Convert an image's <code>src</code> URL to a data URL by loading the image and painting
 * it to a <code>canvas</code>.
 *
 * <p/>Note: this will coerce the image to the desired content type, and it
 * will only paint the first frame of an animated GIF.
 *
 * @param src - image src
 * @param type - the content type (optional, defaults to 'image/png')
 * @param crossOrigin - for CORS-enabled images, set this to
 *                                         'Anonymous' to avoid "tainted canvas" errors
 * @param quality - a number between 0 and 1 indicating image quality
 *                                     if the requested type is 'image/jpeg' or 'image/webp'
 * @returns Promise that resolves with the data URL string
 */
export function imgSrcToDataURL (src: string, type?: string, crossOrigin?: string, quality?: number): Promise<string> {
  type = type || 'image/png'

  return loadImage(src, crossOrigin).then(imgToCanvas).then(function (canvas) {
    return canvas.toDataURL(type, quality)
  })
}

/**
 * Convert a <code>canvas</code> to a <code>Blob</code>.
 * @param canvas
 * @param type - the content type (optional, defaults to 'image/png')
 * @param quality - a number between 0 and 1 indicating image quality
 *                                     if the requested type is 'image/jpeg' or 'image/webp'
 * @returns Promise that resolves with the <code>Blob</code>
 */
export function canvasToBlob (canvas: HTMLCanvasElement, type?: string, quality?: number): Promise<Blob> {
  if (typeof canvas.toBlob === 'function') {
    return new Promise(function (resolve) {
      canvas.toBlob(resolve, type, quality)
    })
  }
  return Promise.resolve(dataURLToBlob(canvas.toDataURL(type, quality)))
}

/**
 * Convert an image's <code>src</code> URL to a <code>Blob</code> by loading the image and painting
 * it to a <code>canvas</code>.
 *
 * <p/>Note: this will coerce the image to the desired content type, and it
 * will only paint the first frame of an animated GIF.
 *
 * @param src - image src
 * @param type - the content type (optional, defaults to 'image/png')
 * @param crossOrigin - for CORS-enabled images, set this to
 *                                         'Anonymous' to avoid "tainted canvas" errors
 * @param quality - a number between 0 and 1 indicating image quality
 *                                     if the requested type is 'image/jpeg' or 'image/webp'
 * @returns Promise that resolves with the <code>Blob</code>
 */
export function imgSrcToBlob (src: string, type?: string, crossOrigin?: string, quality?: number): Promise<Blob> {
  type = type || 'image/png'

  return loadImage(src, crossOrigin).then(imgToCanvas).then(function (canvas) {
    return canvasToBlob(canvas, type, quality)
  })
}

/**
 * Convert an <code>ArrayBuffer</code> to a <code>Blob</code>.
 *
 * @param buffer
 * @param type - the content type (optional)
 * @returns Blob
 */
export function arrayBufferToBlob (buffer: ArrayBuffer, type?: string): Blob {
  return createBlob([buffer], type)
}

/**
 * Convert a <code>Blob</code> to an <code>ArrayBuffer</code>.
 * @param blob
 * @returns Promise that resolves with the <code>ArrayBuffer</code>
 */
export function blobToArrayBuffer (blob: Blob): Promise<ArrayBuffer> {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onloadend = function (e) {
      var result = e.target.result || new ArrayBuffer(0)
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

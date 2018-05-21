// TODO: including these in blob-util.ts causes typedoc to generate docs for them,
// even with --excludePrivate ¯\_(ツ)_/¯

/** @private */
export function loadImage (src, crossOrigin) {
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

/** @private */
export function imgToCanvas (img) {
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

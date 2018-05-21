const pify = require('pify')
const fs = require('fs')
const writeFile = pify(fs.writeFile.bind(fs))
const readFile = pify(fs.readFile.bind(fs))
const path = require('path')

async function main () {
  let inputMd = await readFile(path.join(__dirname, '../docs-tmp/modules/_blob_util_.md'), 'utf8')

  inputMd = inputMd.substring(inputMd.indexOf('## Index'))
  inputMd = inputMd.replace(/_blob_util_\.md#/g, '#')

  let outputMdFile = path.join(__dirname, '../README.md')
  let outputMd = await readFile(outputMdFile, 'utf8')

  outputMd = outputMd.replace(
    /<!-- begin insert API -->[\s\S]+<!-- end insert API -->/,
    `<!-- begin insert API -->\n\n${inputMd}\n\n<!-- end insert API -->`
  )
  await writeFile(outputMdFile, outputMd, 'utf8')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

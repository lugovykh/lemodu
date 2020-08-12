const http = require('http')
const path = require('path')
const fs = require('fs')
const zlib = require('zlib')
const db = require('./modules/db.js').db('lemodu')
const { ObjectID } = require('mongodb')

const sourceDir = 'app'
const hostname = 'localhost'
const port = 3000
const base = `http://${hostname}:${port}`
const MEDIA_TYPES = {
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.json': 'application/json',
  '.map': 'application/json',
  '.txt': 'text/plain',
  '.ts': 'text/typescript',
  '.tsx': 'text/tsx',
  '.mjs': 'application/javascript',
  '.js': 'application/javascript',
  '.jsx': 'text/jsx',
  '.gz': 'application/gzip',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
}
async function send (source, response) {
  if (!source.pipe) throw Error('Source is not a stream')

  source.on('error', (err) => {
    response.statusCode = 500
    response.end('Server error')
    console.error(err)
  })
  response.on('close', () => {
    source.destroy()
  })
  source.pipe(response)
}

new http.Server(async (req, res) => {
  const { method } = req
  const url = new URL(req.url, base)
  let { dir, name, ext } = path.parse(url.pathname)
  let data, stream
  let maxAge = 31536000

  if (!ext) {
    if (method !== 'GET' || url.searchParams.has('data')) {
      if (dir.length > 1) { // dir !== '/'
        const collectionName = dir.slice(1)
        const _id = new ObjectID(name)
        data = await db.collection(collectionName).findOne({ _id })
      } else {
        const collectionName = name
        data = await db.collection(collectionName).find()
      }
      ext = '.json'
    } else {
      dir = sourceDir
      name = 'index'
      ext = '.html'
      maxAge = 0
    }
  } else {
    dir = path.join(sourceDir, dir)
  }
  if (data?._id) {
    stream = zlib.createBrotliCompress()
    stream.end(JSON.stringify(data))
    res.setHeader('Content-Encoding', 'br')
  } else if (data) {
    let comma = ''
    stream = zlib.createBrotliCompress()
    stream.write('[')
    for await (const entry of data) {
      stream.write(`${comma}${JSON.stringify(entry)}`)
      comma = ','
    }
    stream.end(']')
    res.setHeader('Content-Encoding', 'br')
  } else if (
    /^application/.test(MEDIA_TYPES[ext]) ||
    /^text/.test(MEDIA_TYPES[ext]) ||
    /^font/.test(MEDIA_TYPES[ext])
  ) {
    stream = new fs.ReadStream(path.format({ dir, name, ext }))
    stream = stream.pipe(zlib.createBrotliCompress())
    res.setHeader('Content-Encoding', 'br')
  } else {
    stream = new fs.ReadStream(path.format({ dir, name, ext }))
  }
  res.setHeader('Content-Type', MEDIA_TYPES[ext] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', `public, max-age=${maxAge}${maxAge ? ', immutable' : ''}`)

  send(stream, res)
}).listen(port, hostname, () => {
  console.log(`Server running at ${base}`)
})

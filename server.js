const http = require('http')
const path = require('path')
const fs = require('fs')
const db = require('./modules/db.js')

const sourceDir = 'app'
const dbDir = 'db'
const hostname = 'localhost'
const port = 3000
const contentTypes = new Map()
  .set('.htm', 'text/html')
  .set('.html', 'text/html')
  .set('.css', 'text/css')
  .set('.js', 'application/javascript')
  .set('.mjs', 'application/javascript')
  .set('.json', 'application/json')
  .set('.png', 'image/png')
  .set('.ico', 'image/x-icon')
  .set('.svg', 'image/svg+xml')

async function sendFile (source, res) {
  const file = new fs.ReadStream(source)
  file.pipe(res)

  file.on('error', (err) => {
    res.statusCode = 500
    res.end('Server error')
    console.error(err)
  })

  res.on('close', () => {
    file.destroy()
  })
}

new http.Server(async (req, res) => {
  const { headers, url } = req
  const { accept } = headers
  let { dir, name, ext } = path.parse(url)
  let maxAge = 31536000

  if (!ext) {
    if (accept.length < 9 || accept.indexOf('text/html') === -1) {
      dir = path.join(dbDir, dir)
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
  res.setHeader('Content-Type', contentTypes.get(ext))
  res.setHeader('Cache-Control', `public, max-age=${maxAge}${maxAge ? ', immutable' : ''}`)

  sendFile(path.format({ dir, name, ext }), res)
}).on('error', console.error
).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`)
})

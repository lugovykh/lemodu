const http = require('http')
const path = require('path')
const fs = require('fs')

const staticDir = path.join(__dirname, 'app')
const dbDir = path.join(__dirname, 'db')
const hostname = 'localhost'
const port = 3000
const contentTypes = new Map()
  .set('htm', 'text/html')
  .set('html', 'text/html')
  .set('css', 'text/css')
  .set('js', 'application/javascript')
  .set('mjs', 'application/javascript')
  .set('json', 'application/json')
  .set('png', 'image/png')
  .set('ico', 'image/x-icon')
  .set('svg', 'image/svg+xml')

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

async function getOpts (strPath) {
  const rawOpts = strPath.split('?')[1].split('&')
  const opts = new Map()

  for await (const entry of rawOpts) {
    opts.set(...entry.split('='))
  }
  return opts
}

new http.Server(async (req, res) => {
  let { url } = req
  let sourceDir = staticDir
  let fileExtension = url.match(/(?<=\.)[\w\n]{1,6}$/)

  if (fileExtension) {
    fileExtension = fileExtension[0]
  } else {
    const isDataBaseRequest = /^\/json[#?$]/.test(url)
    if (isDataBaseRequest) {
      const opts = await getOpts(url)
      sourceDir = dbDir
      fileExtension = 'json'
      url = `/${opts.get('type')}/${opts.get('id')}.${fileExtension}`
      if (opts.size === 1) {
        url = `/${opts.get('type')}.${fileExtension}`
      }
    } else {
      const isModule = /^\.?\/modules\//i.test(url)
      fileExtension = isModule ? 'js' : 'html'
      url = `${isModule ? url : 'index'}.${fileExtension}`
    }
  }
  res.setHeader('Content-Type', contentTypes.get(fileExtension))
  res.setHeader('Cache-Control', 'public, max-age=86400')

  sendFile(path.join(sourceDir, url), res)
}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`)
})

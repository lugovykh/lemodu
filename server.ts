import { serve } from 'https://deno.land/std@0.101.0/http/server.ts'
import * as path from 'https://deno.land/std@0.101.0/path/mod.ts'
import { MongoClient, Bson } from 'https://deno.land/x/mongo@v0.23.1/mod.ts'

const hostname = 'localhost'
const port = 8000
const sourceDir = 'app'
const base = `http://${hostname}:${port}`
const MEDIA_TYPES: Record<string, string> = {
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
  '.svg': 'image/svg+xml',
  '': 'application/octet-stream'
}

const client = new MongoClient()
await client.connect('mongodb://127.0.0.1:27017')
const db = client.database('lemodu')

const server = serve({ hostname, port })
console.log(`HTTP webserver running. Access it at: ${base}`)

for await (const req of server) {
  const { method } = req
  const url = new URL(req.url, base)
  let { dir, name, ext } = path.parse(url.pathname)
  let data: unknown
  const maxAge = 365 * 24 * 60 * 60

  if (ext !== '') {
    dir = path.join(sourceDir, dir)
  } else if (method === 'GET' && !url.searchParams.has('data')) {
    dir = sourceDir
    name = 'index'
    ext = '.html'
  } else {
    if (dir === '/') {
      const collectionName = name
      data = await db.collection(collectionName).find().toArray()
    } else {
      const collectionName = dir.slice(1)
      const id = new Bson.ObjectId(name)
      data = await db.collection(collectionName).findOne({ _id: id })
    }
    ext = '.json'
  }
  const headers = new Headers()
  headers.set('Content-Type', MEDIA_TYPES[ext])
  headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}${maxAge > 0 ? ', immutable' : ''}`
  )
  const body = data != null
    ? JSON.stringify(data)
    : await Deno.open(path.format({ dir, name, ext }))
  req.respond({ headers, body })
}

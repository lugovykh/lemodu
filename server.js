const http = require('http');
const path = require('path');
const fs = require('fs');

const staticDir = path.join(__dirname, 'src');
const dbDir = path.join(__dirname, 'db');
const hostname = 'localhost';
const port = 3000;
const contentTypes = new Map()
  .set('css', 'text/css')
  .set('js', 'application/javascript')
  .set('mjs', 'application/javascript')
  .set('json', 'application/json')
  .set('png', 'image/png')
  .set('svg', 'image/svg+xml');

async function sendFile(source, res) {
  let file = new fs.ReadStream(source);
  file.pipe(res);

  file.on('error', (err) => {
    res.statusCode = 500;
    res.end('Server error');
    console.error(err);
  });

  res.on('close', () => {
    file.destroy();
  });
}

async function getOpts(strPath) {
  let rawOpts = strPath.split('?')[1].split('&');
  let opts = new Map();

  for await (let entry of rawOpts) {
    opts.set(...entry.split('='));
  }
  return opts;
}

new http.Server(async (req, res) => {
  let sourceDir = staticDir;
  let url = req.url;
  let isToDataBase = /^\/get[\#\?$]/.test(url);

  if (isToDataBase) {
    let opts = await getOpts(url);
    sourceDir = dbDir;
    url = `/${opts.get('type')}/${opts.get('id')}.json`;

    if (opts.size === 1) {
      url = `/${opts.get('type')}.json`;
    }
  }

  let fileExtension = url.match(/(?<=\.)[\w\n]{1,6}$/);

  fileExtension = fileExtension ? fileExtension[0] : null;
  res.statusCode = 200;

  if (fileExtension && contentTypes.has(fileExtension)) {
    res.setHeader('Content-Type', contentTypes.get(fileExtension));
    res.setHeader('Cache-Control', 'public, max-age=86400');

    await sendFile(path.join(sourceDir, url), res);

  } else {
    res.setHeader('Content-Type', 'text/html');

    await sendFile(path.join(sourceDir, 'index.html'), res);
  }
}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
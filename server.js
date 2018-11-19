const http = require('http');
const path = require('path');
const fs = require('fs');

const staticDir = path.join(__dirname, 'src');
const dbDir = path.join(__dirname, 'db');
const hostname = 'localhost';
const port = 3000;
const contentTypes = new Map()
  .set('js', 'application/javascript')
  .set('css', 'text/css')
  .set('json', 'application/json')
  .set('png', 'image/png')
  .set('svg', 'image/svg+xml');

async function sendFile(file, res) {
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

new http.Server(async (req, res) => {
  let sourceDir = staticDir;
  let fileExtension = req.url.match(/(?<=\.)\w+$/);
  
  fileExtension = fileExtension ? fileExtension[0] : null;
  res.statusCode = 200;

  if (fileExtension && contentTypes.has(fileExtension)) {
    res.setHeader('Content-Type', contentTypes.get(fileExtension));

    if (fileExtension == 'json') {
      sourceDir = dbDir;
    }
    let file = new fs.ReadStream(path.join(sourceDir, req.url));
    await sendFile(file, res);

  } else {
    res.setHeader('Content-Type', 'text/html');

    let file = new fs.ReadStream(path.join(sourceDir, 'index.html'));
    await sendFile(file, res);
  }
}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
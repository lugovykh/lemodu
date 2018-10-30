'use strict';

let http = require('http');
let fs = require('fs');

new http.Server((req, res) => {
  if (req.url) {
    let file = new fs.ReadStream(__dirname + '/src' + req.url);
    sendFile(file, res);
    console.log(req.url);
  }
}).listen(3000);

function sendFile(file, res) {
  file.pipe(res);

  file.on('error', (err) => {
    res.statusCode = 500;
    res.end('Server error');
    console.error(err);
  });

  file.on('open', () => {
    console.log('open');
  })
  .on('close', () => {
    console.log('close');
  });

  res.on('close', () => {
    file.destroy();
  });
}

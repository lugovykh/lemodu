const Koa = require('koa');
const app = new Koa();
const serve = require('koa-static');

app.use(serve(__dirname + '/src'));

app.listen(3000);
console.log('Server started: http://localhost:3000/');

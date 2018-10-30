'use strict';

const Koa = require('koa');
const app = new Koa();
const serve = require('koa-static');
const db = require('./db');

db.connect();

app.use(serve('.'));
app.use(serve('src'));
app.use(serve('db'));

app.listen(3000);
console.log('Server started: http://localhost:3000/');

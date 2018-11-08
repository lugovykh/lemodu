'use strict';

const Koa = require('koa');
const app = new Koa();
const send = require('koa-send');
const serve = require('koa-static');
const path = require('path');

const db = require('./db');
const STATIC_DIR = path.join(__dirname, 'src');
const PORT = 3000;

db.connect();

app.use(serve('src'));
app.use(serve('db'));

app.listen(PORT);
console.log('Server started: http://localhost:3000/');

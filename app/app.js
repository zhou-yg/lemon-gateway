'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const koa = require('koa');
const ejsConfig = require('koa-ejs');
const staticConfigCache = require('koa-static-cache');
const convert = require('koa-convert');

const klogger = require('koa-logger');
const koaBody = require('koa-body');

const services = require('./services/');
const koaSession = require('koa-session');

const koaFavicon = require('koa-favicon');

const app = new koa();

const router = require('./router/index');
const proxy = require('./middlewares/proxy');
const frontPage = require('./middlewares/frontPage');
const apiState = require('./util/apiState');

// 启动项
require('./schedule/');

services.service.discovery();

app.use(function(ctx, next) {
  console.log('first:', ctx.url);
  if (ctx.request.path === '/status.stat') {
    ctx.statusCode = 200;
    ctx.body = fs.readFileSync(path.join(__dirname, './public/status.stat')).toString();
  } else {
    return next();
  }
});

app.use(koaFavicon(path.join(__dirname, './favicon.ico'), {
  maxAge: 0,
}));

app.use(klogger());

ejsConfig(app, {
  root: path.join(__dirname, 'views'),
  layout: '',
  viewExt: 'html',
  cache: __ONLINE__ || __PRE__,
  debug: __DEV__ || __TEST__,
});

app.use(function(ctx, next) {
  return next();
});

app.use(services());

app.use(function(ctx, next) {
  let host;
  const origin = ctx.request.get('origin');
  const referer = ctx.request.get('referer');
  const source = origin || referer;
  logger.default.info('request header host:', ctx.request.hostname);
  logger.default.info('request header origin:', origin);
  logger.default.info('request header referer:', referer);

  if (String(source).indexOf('ecrm.taovip.com') !== -1) {
    const { protocol, hostname } = url.parse(String(source));
    host = `${protocol}//${hostname}`;
  }

  if (!host && ctx.request.hostname.indexOf('taovip.com') !== -1) {
    // host = ctx.request.hostname;
    host = source;
  }

  logger.default.info('allow origin:', host);

  if (__DEV__ || __TEST__) {
    ctx.set('Access-Control-Allow-Origin', '*');
  } else if (host) {
    ctx.set('Access-Control-Allow-Origin', host);
  }
  ctx.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
  ctx.set('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');

  if (ctx.method !== 'OPTIONS') {
    return next();
  }
  ctx.body = 'options';
  ctx.status = 200;
});

app.keys = [ 'lemon', 'myId' ];
app.use(koaSession({
  maxAge: 86400 * 1000,

}, app));


app.use(frontPage());

app.use(staticConfigCache(path.resolve(__dirname, './public'), {
  gzip: true,
  dynamic: true,
  prefix: `/${__PATH_PRE__}`,
  // filter(path) {
  //   console.log(`path:`, path, !/\.html$/.test(path));
  //   return !/\.html$/.test(path);
  // },
}));

app.use(function(ctx, next) {
  // console.log('after public:',ctx.request.path);
  return next();
});


app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: __dirname,
  },
}));


app.use(proxy());

const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = err.statusCode || err.status || 500;
    ctx.response.body = {
      message: err.message,
      success: false,
    };
    ctx.app.emit('error', err, ctx);
  }
};

app.on('error', function(err) {
  console.trace();
  logger.default.error(err);
  logger.default.error('app.js onError, error: ', err.message);
});

app.use(errorHandler);

app.use(apiState({
  test(path) {
    return /api\//.test(path);
  },
}));

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async function(ctx, next) {

  logger.default.info(`404 path:${ctx.request.path}`);

  ctx.status = 404;
  ctx.body = ctx.request.path + ' NOT FOUND';
  // await ctx.render('erros/404');
});

module.exports = app;

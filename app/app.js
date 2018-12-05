'use strict';
require('./config/');
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

const router = require('./router/index');
const proxy = require('./middlewares/proxy');
const frontPage = require('./middlewares/frontPage');
const apiState = require('./util/apiState');

// 启动项
require('./schedule/');

services.service.discovery();

module.exports = (options = {}) => {
  const app = new koa();

  options = Object.assign({
    keys: ['lemon', 'myId'],
    publicPath: path.resolve(__dirname, './public'),
    viewPath: path.join(__dirname, 'views'),
    servicePath: path.join(__dirname, './public/services'),
  }, options);

  Object.assign(globalConfig, {
    serviceDir: options.servicePath,
  });

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
    root: options.viewPath,
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

    const { protocol, hostname } = url.parse(String(source));

    host = `${protocol}//${hostname}`;

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

  app.keys = options.keys;
  app.use(koaSession({
    maxAge: 86400 * 1000,

  }, app));


  app.use(frontPage());

  app.use(staticConfigCache(options.publicPath, {
    gzip: true,
    dynamic: true,
    prefix: `/${__PATH_PRE__}`,
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

  app.on('error', function(err) {
    console.trace();
    logger.default.error(err);
    logger.default.error('app.js onError, error: ', err.message);
  });

  app.use(async (ctx, next) => {
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
  });

  app.use(apiState({
    test(path) {
      return /api\//.test(path);
    },
  }));

  app.use(router.routes());
  app.use(router.allowedMethods());

  // app.use(async function(ctx, next) {
  //
  //   logger.default.info(`404 path:${ctx.request.path}`);
  //
  //   ctx.status = 404;
  //   ctx.body = ctx.request.path + ' NOT FOUND';
  // });

  return app;
};

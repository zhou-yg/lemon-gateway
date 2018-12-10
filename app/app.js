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

const createRouter = require('./router/index');

const proxy = require('./middlewares/proxy');
const frontPage = require('./middlewares/frontPage');
const serviceConfig = require('./middlewares/serviceConfig');
const watchServices = require('./schedule/watchServices');

const apiState = require('./util/apiState');

// 启动项
require('./schedule/');


function defaultOptions(options = {}) {
  if (!options.root) {
    options.root = __dirname;
  } else {
    options = Object.assign({
      publicPath: path.resolve(options.root, './public'),
      viewPath: path.join(options.root, 'views'),
      servicePath: path.join(options.root, './public/services'),
      nodeServicesPath: path.join(options.root, './services'),
      routerPath: path.join(options.root, './router'),
    }, options);
  }

  options = Object.assign({
    keys: ['lemon', 'myId'],
    // publicPath: path.resolve(options.root, './public'),
    // viewPath: path.join(options.root, 'views'),
    // servicePath: path.join(options.root, './public/services'),
    // nodeServicesPath: path.join(options.root, './services'),
    // routerPath: path.join(options.root, './router/api'),
  }, options);

  return options;
}

function* createApp(options) {
  const app = new koa();

  options = defaultOptions(options);

  Object.assign(globalConfig, {
    serviceDir: options.servicePath,
  });

  watchServices.discovery();

  app.use(function(ctx, next) {
    console.log('first:', ctx.url);
    if (ctx.request.path === '/status.stat') {
      ctx.statusCode = 200;
      ctx.body = fs.readFileSync(path.join(__dirname, './public/status.stat')).toString();
    } else {
      return next();
    }
  });

  yield { app, state: 'stat' };

  app.use(koaFavicon(path.join(__dirname, './favicon.ico'), {
    maxAge: 0,
  }));

  yield { app, state: 'favicon' };

  app.use(klogger());

  yield { app, state: 'logger' };

  ejsConfig(app, {
    root: options.viewPath,
    layout: '',
    viewExt: 'html',
    cache: __ONLINE__ || __PRE__,
    debug: __DEV__ || __TEST__,
  });

  yield { app, state: 'ejs' };

  app.use(function(ctx, next) {
    return next();
  });

  app.use(services(options.nodeServicesPath));

  yield { app, state: 'services' };

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

  yield { app, state: 'cors' };

  app.keys = options.keys;
  app.use(koaSession({
    maxAge: 86400 * 1000,

  }, app));

  yield { app, state: 'session' };


  app.use(serviceConfig());

  yield { app, state: 'serviceConfig' };

  yield { app, state: 'basic'}

  app.use(frontPage());

  yield { app, state: 'frontPage'}

  app.use(staticConfigCache(options.publicPath, {
    gzip: true,
    dynamic: true,
    prefix: `/${__PATH_PRE__}`,
  }));

  yield { app, state: 'static' };


  app.use(function(ctx, next) {
    // console.log('after public:',ctx.request.path);
    return next();
  });

  app.use(proxy());

  yield { app, state: 'proxy' };

  app.use(koaBody({
    multipart: true,
    formidable: {
      uploadDir: __dirname,
    },
  }));

  yield { app, state: 'body' };

  app.on('error', function(err) {
    // console.trace();
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

  yield { app, state: 'error' };

  app.use(apiState({
    test(path) {
      return /api\//.test(path);
    },
  }));

  yield { app, state: 'apiState' };

  let router = createRouter(options.routerPath);

  app.use(router.routes());
  app.use(router.allowedMethods());

  yield { app, state: 'router'}

  // app.use(async function(ctx, next) {
  //
  //   logger.default.info(`404 path:${ctx.request.path}`);
  //
  //   ctx.status = 404;
  //   ctx.body = ctx.request.path + ' NOT FOUND';
  // });

  return app;
};

module.exports = function (op, cb) {
  let g = createApp(op);
  let r = g.next();
  while (!r.done) {
    cb(r.value);
    r = g.next();
  }
  return r.value;
}

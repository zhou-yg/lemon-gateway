'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const koa = require('koa');
const ejsConfig = require('koa-ejs');
const staticConfigCache = require('koa-static-cache');
const convert = require('koa-convert');
const loginMiddeware = require('@qp/node-login-middleware');

const klogger = require('koa-logger');
const koaBody = require('koa-body');

const services = require('./services/');
const koaSession = require('koa-session');

const app = new koa();

const router = require('./router/index');
const proxy = require('./router/proxy');
const apiState = require('./util/apiState');


app.use(function(ctx, next) {
  if (ctx.request.path === '/status.stat') {
    ctx.statusCode = 200;
    ctx.body = fs.readFileSync(path.join(__dirname, './public/status.stat')).toString();
  } else {
    return next();
  }
});

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
  logger.default.info('request header origin:', source, origin, referer);

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

  // console.log(ctx.request);
  if (ctx.request.method !== 'OPTIONS') {
    return next();
  }
  ctx.body = 'options';
  ctx.status = 200;

});

app.use(staticConfigCache(path.resolve(__dirname, './public/'), {
  maxAge: 24 * 60 * 60,
  gzip: true,
  prefix: `/${__PATH_PRE__}`,
  filter(path) {
    logger.default.info('static-path:' + JSON.stringify(path) + (!/static\/pie\/$/.test(path)));
    return !/static\/pie\/$/.test(path);
  },
}));

app.use(staticConfigCache(path.resolve(__dirname, './public/'), {
  gzip: true,
  dynamic: true,
  prefix: `/${__PATH_PRE__}`,
  filter(path) {
    logger.default.info('static-path2:' + JSON.stringify(path) + (/static\/pie\/$/.test(path)));
    return /static\/pie\/$/.test(path);
  },
}));


app.use(koaBody({
  formidable: {
    uploadDir: __dirname,
  },
}));

app.keys = [ 'weike', 'pineapple' ];
app.use(koaSession({
  maxAge: 86400 * 1000,

}, app));

app.use(convert(loginMiddeware({
  framework: 'koa',
  app: 'pineapple',
  filter: {
    test: url => {
      return !/^\/?(api)|(pineapple\/api)|(weike-crm)/.test(url);
    },
  },
})));

proxy(app);

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
  // ctx.body = ctx.request.path + ' NOT FOUND';
  await ctx.render('erros/404');
});

module.exports = app;

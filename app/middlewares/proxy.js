const proxy = require('koa-proxy');
const convert = require('koa-convert');
const U = require('url');

const service = require('../services/service');
const watchServices = require('../schedule/watchServices');
const backendHosts = require('../services/backend/hosts');

watchServices.on('discovery', () => {
  logger.default.info('proxyUpdate');
  proxyUpdate();
});

const proxyMap = new Map();

function proxyUpdate () {
  const m = service.getServiceMap();

  console.log(`proxyUpdate:`, m);

  if (m.size > 0) {
    proxyMap.clear();

    for( let [serviceName, config] of m) {
      if (config.proxy) {

        console.log(config);

        proxyMap.set(serviceName, config.proxy.map(p => {

          const proxyConfigOne = {
            host: p.host,
            match: new RegExp(p.match),
            map (path) {
              logger.default.info(`case a proxy:`, path, p.match, p.replace);

              if (p.replace) {
                const r = String(path).replace(new RegExp(p.match), p.replace);
                return r;
              }
              return path;
            },
          };

          if (Array.isArray(proxyConfigOne.host)) {
            let old = proxyConfigOne.host;
            let getHost = function getHost(hostArr) {
              return backendHosts.filter(hostArr)[parseInt(Math.random() * hostArr.length)]
            }.bind(null, old);
            Object.defineProperty(proxyConfigOne, 'host', {
              get: getHost,
            });
          }

          console.log(`proxyConfigOne:`, proxyConfigOne);

          const r = convert(proxy(proxyConfigOne));
          r._proxyConfig = proxyConfigOne;
          return r;
        }));
      }
    }
  }
}

proxyUpdate();

async function proxyCompose(serviceName, ctx, next) {
  var proxyArr = serviceName ? proxyMap.get(serviceName) : null;

  console.log(proxyMap);

  if (proxyArr) {

    const composedProxy = proxyArr.reduceRight((nextFn, proxy) => {
      return async () => {
        try {
          return await proxy(ctx, nextFn);
        } catch (e) {
          logger.default.error(serviceName, ctx.request.get('referer'), ctx.path, e);
          // 服务挂了
          if (e.code === 'ECONNREFUSED') {
            ctx.status = 510;
            ctx.body = e;

            backendHosts.lost(`${e.address}:${e.port}`);

            // 重试
            return await proxy(ctx, nextFn);
          } else {
            throw e;
          }
        }
      };
    }, next);

    return composedProxy();
  } else {
    return await next();
  }
}

module.exports = function () {

  return async function (ctx, next) {
    const referer = ctx.request.get('referer');
    const fromServiceReg = new RegExp(`^/${__PATH_PRE__}/services/([\\w]+)`);
    const {path} = U.parse(referer);

    var serviceName = path ? path.match(fromServiceReg) : null;
    serviceName = serviceName ? serviceName[1] : null;

    if (serviceName) {
      logger.default.info(`proxy serviceName:`, serviceName);

      return await proxyCompose(serviceName, ctx, next);
    } else {
      await next();
    }
  }
}

module.exports.proxyUpdate = proxyUpdate;

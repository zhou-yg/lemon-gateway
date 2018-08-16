const proxy = require('koa-proxy');

const testHost = 'http://localhost:19003/';

module.exports = function p(app) {
  app.use(proxy({
    host: testHost,
    match: /proxy\//,
    map (path) {
      if (/proxy\/api\//.test(path)) {
        const r = String(path).replace(/proxy\/api/, '');
        logger.default.info(`weike-from proxy:${r}`);
        return r;
      }
      return path;
    },
  }));
}

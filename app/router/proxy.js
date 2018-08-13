const proxy = require('koa-proxy');

const wkCrmDevHost = 'http://121.43.165.245:19003/';
const wkCrmTestHost = 'http://localhost:19003/';
const wkCrmOnlineHost = 'http://10.27.99.49:19003/';

const crmHost = __DEV__ ? wkCrmDevHost : __TEST__ ? wkCrmTestHost : wkCrmOnlineHost;

module.exports = function p(app) {
  app.use(proxy({
    host: 'http://121.199.183.86:30005/',
    match: /loginQuota$/,
    map (path) {
      if (/proxy\/weike-op\//.test(path)) {
        const r = String(path).replace(/pineapple\/proxy\/weike-op\//, '');
        return r;
      }
      return path;
    },
  }));
  app.use(proxy({
    host: crmHost,
    match: /proxy\/weike-crm\//,
    map (path) {
      if (/proxy\/weike-crm\//.test(path)) {
        const r = String(path).replace(/pineapple\/proxy\/weike-crm\//, '').replace(/\/proxy\/weike-crm\//, '');
        logger.default.info(`weike-from proxy:${r}`);
        return r;
      }
      return path;
    },
  }));
}

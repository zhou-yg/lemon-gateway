/**
 * Created by zyg on 17/1/13.
 */

const path = require('path');
const fs = require('fs');
var loadApi = require('../util/loadApi');
var R = require('koa-router');

module.exports = (routerPath) => {

  let originApiPath = path.resolve(__dirname, './api');
  let preName = path.parse(originApiPath).name;

  var registerRouter = loadApi(originApiPath, '');

  router = new R({
    prefix: `/${__PATH_PRE__}`,
  });
  router = registerRouter(router, preName, []);

  console.log(`routerPath:`, routerPath);

  if (typeof routerPath === 'string') {
    let preName2 = path.parse(routerPath).name;
    let registerRouter2 = loadApi(routerPath, '.');

    if (preName2 === 'router') {
      preName2 = '';
    }

    router = registerRouter2(router, preName2, []);
  }

  return router;
};

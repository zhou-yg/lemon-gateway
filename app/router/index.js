/**
 * Created by zyg on 17/1/13.
 */

const path = require('path');
var loadApi = require('../util/loadApi');
var R = require('koa-router');

var registerRouter = loadApi(path.resolve(__dirname, './api'), '');

// const r2 = r1.map(p => `/${__PATH_PRE__}${p}`);

router = new R({
  prefix: `/${__PATH_PRE__}`,
});
// if (!__DEV__) {
//   router.prefix('pineapple');
// }

router = registerRouter(router, 'api', []);

// router = require('./views/p')(router);

module.exports = router;

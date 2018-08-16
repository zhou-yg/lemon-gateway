const path = require('path');
const loadServicce = require('../util/loadService');

const servicesObj = loadServicce(path.resolve(__dirname, './'), path.resolve(__dirname, './'));

module.exports = function () {
  return function (ctx, next) {
    ctx.services = servicesObj;
    return next();
  };
}

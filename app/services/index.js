const path = require('path');
const loadService = require('../util/loadService');

const servicesObj = loadService(path.resolve(__dirname, './'));

module.exports = function (op) {
  // services path;
  if (typeof op === 'string') {
    op = loadService(op);
  }

  let obj = Object.assign({}, servicesObj, op);

  logger.default.info('servicesObj:', servicesObj);
  logger.default.info('servicesObj.op:', op);

  return function (ctx, next) {
    ctx.services = obj;
    return next();
  };
}

Object.assign(module.exports, servicesObj);

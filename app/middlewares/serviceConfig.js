const {isService, getService} = require('../util/service');

module.exports = function () {

  return function (ctx, next) {
    if (isService(ctx)) {
      let name = getService(ctx);

      ctx._serviceConfig = ctx.services.service.getServiceMap().get(name) || {};

      return next();
    } else {
      return next();
    }
  };
};

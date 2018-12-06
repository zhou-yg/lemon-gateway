const path = require('path');
const fs = require('fs');

const {isService, getService, getHtml} = require('../util/service');

function serviceHTML (ctx) {
  const htmlFile = path.join(globalConfig.serviceDir, getService(ctx), getHtml(ctx));
  const tpl = fs.readFileSync(htmlFile).toString();

  console.log(htmlFile);

  ctx.type = 'html';
  ctx.body = tpl;
}

module.exports = function () {

  return async function frontPage (ctx, next) {
    if (isService(ctx)) {
      logger.default.info(`is service:`, getService(ctx));

      serviceHTML(ctx);
    } else {
      logger.default.info(`is not service`);
      await next();
    }
  }
}

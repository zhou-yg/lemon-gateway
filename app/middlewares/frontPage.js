const path = require('path');
const fs = require('fs');

function isService(ctx) {
  const u = ctx.request.url;

  // console.log(`ru:`, u);
  // console.log(`r1:`, new RegExp(`^/${__PATH_PRE__}`).test(u));
  // console.log(`r2:`, /services\/[\w]+(\/[\w]+\.html)?$/.test(ctx.request.url));

  return new RegExp(`^/${__PATH_PRE__}`).test(u) && /services\/[\w]+(\/[\w]+\.html)?$/.test(ctx.request.url);
}

function getService(ctx) {
  const u = ctx.request.url;

  const r = u.match(/services\/([\w]+)/)

  return r[1];
}

function getHtml(ctx) {
  const u = ctx.request.url;

  const r = u.match(/[\w]+.html/);

  return r ? r[0] : `index.html`;
}

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

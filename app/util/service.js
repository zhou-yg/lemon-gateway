
exports.isService = function isService(ctx) {
  const u = ctx.request.path;

  // console.log(`ru:`, u);
  // console.log(`r1:`, new RegExp(`^/${__PATH_PRE__}`).test(u));
  // console.log(`r2:`, /services\/[\w]+(\/[\w]+\.html)?$/.test(ctx.request.url));

  return new RegExp(`^/${__PATH_PRE__}`).test(u) && /services\/[\w]+(\/[\w]+\.html)?$/.test(u);
}


exports.getService = function getService(ctx) {
  const u = ctx.request.path;

  const r = u.match(/services\/([\w]+)/)

  return r[1];
}

exports.getHtml = function getHtml(ctx) {
  const u = ctx.request.path;

  const r = u.match(/[\w]+.html/);

  return r ? r[0] : `index.html`;
}



module.exports = async function state(ctx, next) {

  const r = ctx.services.service.validate();

  ctx.body = {
    success: !r,
    error: r
  }
}

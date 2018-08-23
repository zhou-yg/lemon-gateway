const _ = require('lodash')
module.exports = async function (ctx, next) {

  const l = await ctx.services.permission.check.getPermission(ctx.session.userData.number);

  ctx.body = {
    success: true,
    data: _.pick(ctx.session.userData, [
      'id',
      'name',
      'number',
      'realName',
      'newRoleId',
    ]),
    _data: ctx.session.userData,

    _l: l,
  };
}

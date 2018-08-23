const _ = require('lodash')
const fs = require('fs');
const moment = require('moment');

module.exports = async function (ctx, next) {

  ctx.body = ctx.services.state.deployVersion();
}

const fs = require('fs');
const path = require('path');
const unzip = require('../../../util/unzip');

module.exports = {
  method: 'post',
  handler: async (ctx, next) => {
    // console.log(ctx.is('multipart'), ctx.request.files);
    // console.log(ctx.files);
    const {name, md5} = ctx.request.body;

    if (ctx.is('multipart') && ctx.request.files) {
      const {zip} = ctx.request.files;
      if (zip) {
        const serviceDir = path.join(globalConfig.serviceDir, name);
        if (!fs.existsSync(serviceDir)) {
          fs.mkdirSync(serviceDir);
        }
        try {
          const r = await unzip(zip.path, serviceDir);
          ctx.body = {
            name,
            errors: r,
          }

          fs.unlink(zip.path);

        } catch (e) {
          ctx.body = {
            error: e.message,
            message: 'muse be zip file'
          }
        }
      }
    }
  },
}

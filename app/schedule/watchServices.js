const fs = require('fs');
const path = require('path');

const service = require('../services/service');

const EventEmitter = require('events');
const seriviceEvt = new EventEmitter();

const {serviceDir} = globalConfig;

logger.default.info('watchService::', serviceDir);

var watchedChildren = [];

function discoveryCallback() {
  logger.default.info('watchService::');
  service.discovery();

  seriviceEvt.emit('discovery');
}

function watchServiceChildren() {
  const fpArr = fs.readdirSync(serviceDir)
    .map(n => path.resolve(serviceDir, n))
    .filter(fp => fs.lstatSync(fp).isDirectory());

  fpArr.forEach(fp => {
    if (!watchedChildren.includes(fp)) {
      fs.watch(fp, discoveryCallback);
      watchedChildren.push(fp);
    }
  });

  watchedChildren = watchedChildren.filter(fp => {
    const r = fpArr.includes(fp);

    fs.unwatchFile(fp);

    return r;
  });
}

fs.watch(serviceDir, () => {

  watchServiceChildren();
  discoveryCallback();
});

watchServiceChildren();
discoveryCallback();

module.exports = {
  on: seriviceEvt.on.bind(seriviceEvt),
}

'use strict';
const path = require('path');
const config = require('../config/index')(require(path.resolve(__dirname, '../../package.json')));

const log4js = require('log4js');

log4js.configure(config.log4js);

global.logger = Object.keys(config.log4js.categories).map(c => {
  return {
    [c]: log4js.getLogger(c),
  };
}).reduce((p, n) => Object.assign(p, n), {});

const app = require('../app');

app.listen(8888);

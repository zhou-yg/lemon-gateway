'use strict';
const path = require('path');
const config = require('../config/index');

const log4js = require('log4js');

log4js.configure(config.log4js);

global.logger = Object.keys(config.log4js.categories).map(c => {
  return {
    [c]: log4js.getLogger(c),
  };
}).reduce((p, n) => Object.assign(p, n), {});

global.globalConfig = config;

const app = require('../app');

const PORT = config.port;

app.listen(PORT);

console.log(`listen on port:${PORT}`);

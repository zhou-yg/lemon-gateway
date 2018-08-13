'use strict';

const dev = require('./config.dev.js');

module.exports = appInfo => {
  const config = dev(appInfo);

  return config;
};

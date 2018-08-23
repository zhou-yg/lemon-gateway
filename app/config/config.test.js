'use strict';

const merge = require('lodash/merge');
const dev = require('./config.dev.js');

module.exports = appInfo => {
  const config = dev(appInfo);

  config.log4js = merge(config.log4js, {
    categories: {
      'default': {
        level: 'info',
      },
      mongo: {
        level: 'info',
      },
    },
  });

  return config;
};

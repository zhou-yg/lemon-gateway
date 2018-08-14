'use strict';

const merge = require('lodash/merge');
const dev = require('./config.dev.js');

module.exports = appInfo => {
  const config = dev(appInfo);

  merge(config, {
    log4js: {
      categories: {
        'default': {
          level: 'debug',
        },
        mongo: {
          level: 'debug',
        },
      },
    },
  });

  return config;
};

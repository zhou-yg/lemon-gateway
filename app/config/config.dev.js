'use strict';
const path = require('path');

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1534141449115_2059';

  // add your config here
  config.middleware = [];

  config.log4js = {
    appenders: {
      out: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: '[%p] %[ %c %] %h %m%n',
        }
      },
    },
    categories: {
      'default': {
        appenders: ['out'],
        level: 'debug',
      },
      mongo: {
        appenders: ['out'],
        level: 'debug',
      },
    },
    pm2: true,
  };

  config.port = process.env.PORT || 8870;

  config.serviceDir = path.join(__dirname, '../public/services');

  config.serviceConfigFileName = 'lemon.json';

  return config;
};

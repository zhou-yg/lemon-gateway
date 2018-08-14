'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1534141449115_2059';

  // add your config here
  config.middleware = [];

  config.log4js = {
    appenders: {
      out: { type: 'console' },
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


  return config;
};

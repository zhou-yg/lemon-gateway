const request = require('request');
const URL = require('url');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function loadApi (base, name) {
  base = path.resolve(base, name);
  const files = fs.readdirSync(path.resolve(__dirname, base));
  return files.map(file => {
    var filePath = path.resolve(__dirname, base, file);
    if (/\.js$/.test(file)) {
      file = file.replace(/\.js$/, '');
      var handler = require(filePath);
      var method = handler.method;
      if(!method){
        method = 'get';
      }else {
        handler = handler.handler;
      }

      return {
        path: path.resolve(base, file),
        method,
        handler,
      };
    } else if (fs.lstatSync(filePath).isDirectory()) {
      return loadApi(base, file);
    }
  }).filter(_ => _);
}

module.exports = function (base, name) {
  var apiArr = loadApi(base, name);

  while(apiArr.some(obj => Array.isArray(obj))) {
    apiArr = apiArr.reduce((pre, next) => pre.concat(next), []);
  }
  apiArr = apiArr.map(obj => {
    obj.path = obj.path.replace(base, '');
    return obj;
  });

  logger.default.info(`apiArr:`, apiArr);

  return function registerRouter (router, pre, apiNames) {
    apiArr.forEach(obj => {
      if (apiNames.indexOf(obj.path) !== -1 || apiNames.length === 0) {
        logger.default.info('register api', obj.path);
        router[obj.method](`/${pre}${obj.path}`, obj.handler);
      }
    });
    return router;
  }
};

const fs = require('fs');
const path = require('path');

function loadService (base, name) {
  base = path.resolve(base, name);
  var files = fs.readdirSync(path.resolve(__dirname, base));

  if (base && files.indexOf('index.js') !== -1) {
    files = files.filter(file => {
      return file !== 'index.js';
    });
  }

  return files.map(file => {
    var filePath = path.resolve(__dirname, base, file);
    if (/\.js$/.test(file)) {
      file = file.replace(/\.js$/, '');
      var handler = require(filePath);

      return {
        path: path.resolve(base, file),
        handler,
      };
    } else if (fs.lstatSync(filePath).isDirectory()) {
      return loadService(base, file);
    }
  }).filter(_ => _);
}
function assignKeys (obj, keys, value) {
  let temp = obj;
  keys.slice(0, keys.length - 1).forEach(k => {
    if (!temp[k]) {
      temp[k] = {};
    }
    temp = temp[k];
  });
  temp[keys[keys.length - 1]] = value;
}

module.exports = function (base, name) {

  var servicesArr = loadService(base, name);

  while(servicesArr.some(obj => Array.isArray(obj))) {
    servicesArr = servicesArr.reduce((pre, next) => pre.concat(next), []);
  }

  servicesArr = servicesArr.map(obj => {
    obj.path = obj.path.replace(base, '');
    return obj;
  });

  var servicesObj = {};
  servicesArr.forEach(obj => {
    const keys = obj.path.split('/').filter(_ => _);
    assignKeys(servicesObj, keys, obj.handler);
  });

  logger.default.info('servicesObj:', servicesObj);
  return servicesObj;
};

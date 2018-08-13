const axios = require('axios');

class Config {
  constructor (c = {}) {
    if (!c.method) {
      c.method = 'GET';
    }
    Object.assign(this, c);
  }
}

function transConfigToFunc (config) {
  return function (arg) {
    return axios({
      url: config.url,
      data: arg,
      headers: Object.assign({
        'Content-Type': 'application/json',
      }, config.headers),
      method: config.method,
    }).then(res => {
      if (res.status === 200) {
        return Promise.resolve(res.data);
      } else {
        return Promise.reject(res);
      }
    });
  }
}

function proxyApi (obj) {
  Object.keys(obj).forEach(name => {
    if (obj[name] instanceof Config) {
      obj[name] = transConfigToFunc(obj[name]);
    } else if (typeof obj[name] === 'object') {
      obj[name] = proxyApi(obj[name]);
    }
  });
  return obj;
}

const apiConfig = {
  permission: {
    get: new Config({
      headers: {
      },
      url: 'http://www.baidu.com',
      method: 'POST',
    }),
  },
}

module.exports = proxyApi(apiConfig);

const fs = require('fs');
const path = require('path');
const {serviceConfigFileName} = globalConfig;
const _ = require('lodash');
const serviceMap = new Map();

function configValidate (name, json) {
  json.name = name;
  if (json.proxy) {
    if (!Array.isArray(json.proxy)) {
      throw new Error(`${serviceConfigFileName} proxy must be array`);
    }
    if (!json.proxy.every(obj => obj.host && obj.match)) {
      throw new Error(`${serviceConfigFileName} proxy must have host and match`);
    }
  }
  if (json.permission) {
    if (!Array.isArray(json.permission)) {
      throw new Error(`${serviceConfigFileName} permission must be array`);
    }
    if (!json.permission.every(str => typeof str === 'string')) {
      throw new Error(`${serviceConfigFileName} permission can only includes string`);
    }
  }
  if (json.ssr) {

  }
  if (json.env) {
    if (typeof json.env !== 'object') {
      throw new Error(`${serviceConfigFileName} env must be Object`);
    }
    let envKeys = ['test', 'dev', 'online'];

    // console.log(`Object.keys(json.env).filter(k => envKeys.indexOf(k) === -1).length : `,Object.keys(json.env).filter(k => envKeys.indexOf(k) === -1).length);

    if (Object.keys(json.env).filter(k => envKeys.indexOf(k) === -1).length > 0) {
      throw new Error(`${serviceConfigFileName} env can only has keys ${envKeys.join(',')} `);
    }
    envKeys.filter(envK => json.env[envK]).forEach(envK => {
      configValidate(name, json.env[envK])
    })
  }
  return json;
}
// 合并配置项中的env字段
function transServiceConfig(lemonConfig) {
  lemonConfig = JSON.parse(JSON.stringify(lemonConfig));
  if (lemonConfig.env) {
    if (__DEV__ && lemonConfig.env.dev) {
      _.mergeWith(lemonConfig, lemonConfig.env.dev, (objValue, srcValue) => {
        if (_.isArray(objValue)) {
          return objValue.concat(srcValue);
        }
      });
    }
    if (__TEST__ && lemonConfig.env.test) {
      _.mergeWith(lemonConfig, lemonConfig.env.test, (objValue, srcValue) => {
        if (_.isArray(objValue)) {
          return objValue.concat(srcValue);
        }
      });
    }
    if (__ONLINE__ && lemonConfig.env.online) {
      _.mergeWith(lemonConfig, lemonConfig.env.online, (objValue, srcValue) => {
        if (_.isArray(objValue)) {
          return objValue.concat(srcValue);
        }
      });
    }
    delete lemonConfig.env;
  }
  if (lemonConfig.proxy) {
    // lemonConfig.proxy.forEach(proxyConfigOne => {
    //   if (Array.isArray(proxyConfigOne.host)) {
    //     let old = proxyConfigOne.host;
    //     let getHost = function getHost(hostArr) {
    //       console.trace();
    //       return hostArr[parseInt(Math.random() * hostArr.length)]
    //     }.bind(null, old);
    //     Object.defineProperty(proxyConfigOne, 'host', {
    //       get: getHost,
    //     });
    //   }
    // })
  }

  return lemonConfig;
}

module.exports = {
  getServiceMap () {

    return serviceMap;
  },
  validate () {
    const allService = fs.readdirSync(serviceDir).filter(name => {
      return fs.existsSync(path.join(serviceDir, name, serviceConfigFileName));
    });

    var curService;
    try {
      const allConfigFiles = allService.map(sName => {
        return JSON.parse(fs.readFileSync(path.join(serviceDir, sName, serviceConfigFileName)).toString())
      }).map((o, i) => {
        curService = allService[i];
        return configValidate(allService[i], o);
      }).map(transServiceConfig);

    } catch (e) {
      return {
        service: curService,
        message: e.message,
      }
    }
  },
  discovery () {

    const allService = fs.readdirSync(globalConfig.serviceDir).filter(name => {
      return fs.existsSync(path.join(globalConfig.serviceDir, name, serviceConfigFileName));
    });

    console.log(globalConfig.serviceDir, allService);

    try {
      const allConfigFiles = allService.map(sName => {
        return JSON.parse(fs.readFileSync(path.join(globalConfig.serviceDir, sName, serviceConfigFileName)).toString())
      }).map((o, i) => configValidate(allService[i], o)).map(transServiceConfig);

      serviceMap.clear();

      allService.forEach((n, i) => serviceMap.set(n, allConfigFiles[i]));

    } catch (e) {
      logger.default.error(e);
    }
  },
}

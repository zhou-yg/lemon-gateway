'use strict';
const Controller = require('egg').Controller;
const moment = require('moment');
const fs = require('fs');
const versionFile = './.v';
const os = require('os');
fs.writeFileSync(versionFile, moment().format('YYYY-MM-DD HH:mm:ss'));


class HomeController extends Controller {
  async version() {
    this.ctx.body = {
      version: fs.readFileSync(versionFile).toString(),
      'os.networkInterfaces': os.networkInterfaces(),
    };
  }
}

module.exports = HomeController;

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const vFile = '.v';

fs.writeFileSync(vFile, moment().format('YYYY-MM-DD HH:mm:ss'));

module.exports = function () {
  return fs.readFileSync(vFile).toString();
}

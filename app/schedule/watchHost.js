const Event = require('events');
var request = require('http').request;

const evt = new Event();

var isWatching = false;

var checkInterval = 5000; // 10s
var checkTimeout = 10 * 1000;

var checkHosts = new Set();

function startCheck() {
  if (checkHosts.size <= 0) {
    isWatching = false;
    return;
  }
  isWatching = true;

  logger.default.info('lost hosts', checkHosts);

  for (let h of checkHosts) {
    let req = request(`http://${h}`, (res) => {
      clearTimeout(si);
      checkHosts.delete(h);
      evt.emit('active', h);
    }).on('error', (e) => {
      clearTimeout(si);
      if (e.code === 'ECONNREFUSED') {
        setTimeout(startCheck, checkInterval);
      } else {
        checkHosts.delete(h);
        evt.emit('active', h);
      }
    });
    let si = setTimeout(() => req.abort(), checkTimeout);
  }
}

function startWatch(hosts) {
  checkHosts = new Set(hosts);
  if (isWatching) {
  } else {
    startCheck();
  }
}

module.exports = {
  on: evt.on.bind(evt),
  startWatch: startWatch,
}

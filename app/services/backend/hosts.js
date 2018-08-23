const U = require('url');

const lostHosts = new Set();

const activeHosts = new Set();

const watchHost = require('../../schedule/watchHost');

watchHost.on('active', h => {
  logger.default.info('hosts active', h);
  op.active(h);
});

const op = {
  active (host) {
    activeHosts.add(host)
    lostHosts.delete(host);
  },
  lost (host) {
    lostHosts.add(host);
    activeHosts.delete(host);

    watchHost.startWatch(lostHosts);
  },
  filter (hostArr) {
    console.log(hostArr);
    console.log(lostHosts);
    return hostArr.map(u => U.parse(u))
      .filter(hObj => !lostHosts.has(hObj.host))
      .map(hObj => hObj.href)
  }
}

module.exports = op;

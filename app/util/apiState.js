const myState = {

};

const maxLen = 50;

module.exports = (config) => {

  const test = config.test || function () { return true };

  return async (ctx, next) => {
    const {path} = ctx.request;
    if (test(path)) {
      if (!myState[path]) {
        myState[path] = {
          time: [],
        };
      }
      const state = myState[path];

      let now = Date.now();
      await next();
      let now2 = Date.now();

      state.time.push(now2, now2 - now);
      if (state.time.length > maxLen) {
        state.time = state.time.slice(state.time.length - maxLen);
      }
    } else {
      await next();
    }
  };
};

module.exports.getState = () => myState;

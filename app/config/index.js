global.__DEV__ = process.env.NODE_ENV !== 'production';
global.__TEST__ = process.env.ENV === 'test';
global.__PRE__ = process.env.ENV === 'pre';
global.__ONLINE__ = process.env.ENV === 'online';
global.__PATH_PRE__ = process.env.PATH_PRE || 'lemon';
global.__DB__ = 'pineapple';

module.exports = (appInfo) => {
  if (__DEV__) {
    return require('./config.dev')(appInfo);
  } else if (__TEST__) {
    return require('./config.test')(appInfo);
  } else if (__ONLINE__){
    return require('./config.online')(appInfo);
  } else {
    throw new Error('can not decide an envirnment');
  }

}

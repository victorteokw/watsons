const join = require('lodash/join');

module.exports = function formatKeyPath(keyPath) {
  return join(keyPath, '.');
};

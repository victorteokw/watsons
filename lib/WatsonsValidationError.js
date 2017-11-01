const WatsonsError = require('./WatsonsError');

class WatsonsValidationError extends WatsonsError {
  constructor(...args) {
    super(args);
    this.errorDescription = args[0];
  }
}

module.exports = WatsonsValidationError;

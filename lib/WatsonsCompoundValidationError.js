const WatsonsValidationError = require('./WatsonsValidationError');

class WatsonsCompoundValidationError extends WatsonsValidationError {
  constructor(...args) {
    super(...args);
    if (typeof args[0] === 'object') {
      this.errorDescription = args[0];
      this.message = this.getErrorMessage();
    }
  }

  getErrorMessage() {
    if (this.errorDescription) {
      // Simple doing this for now
      return JSON.stringify(this.errorDescription);
    }
  }
}

module.exports = WatsonsCompoundValidationError;

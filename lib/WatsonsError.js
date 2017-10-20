class WatsonsError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, WatsonsError);
  }
}

module.exports = WatsonsError;

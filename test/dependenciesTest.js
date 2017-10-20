const watsons = require('../index');
const WatsonsError = require('../lib/WatsonsError');
const formatKeyPath = require('../lib/formatKeyPath');

const assert = require('assert');

describe("Watsons", function() {
  describe("dependencies", function() {

    describe("Allowing dependencies check", function() {
      it("throw if not fulfilled.", function() {
        watsons.addValidator("match", function(s, keyPath, root, regexp) {
          if (s === undefined) return;
          if (!regexp.test(s)) {
            throw new WatsonsError(`String value at keyPath \
'${formatKeyPath(keyPath)}' does not match ${regexp.toString()}.`);
          }
        }, true, ["string"]);
        assert.throws(function() {
          const obj = {
            a: 1
          };
          const checker = {
            a: watsons.number.match(/a/)
          };
          watsons.validate(obj, checker);
        }, /^WatsonsError: Unfulfilled validator dependencies string for validator match\.$/);
      });

      it("not throw if fulfilled.", function() {
        watsons.addValidator("gte", function(n, keyPath, root, c) {
          if (n === undefined) return;
          if (!(n >= c)) {
            throw new WatsonsError(`Value (${n}) at keyPath ${formatKeyPath(keyPath)} should be greater or equal ${c}.`);
          }
        }, true, ["number"]);
        const obj = {
          a: 200
        };
        const checker = {
          a: watsons.number.gte(100)
        };
        watsons.validate(obj, checker);
      });
    });
  });
});

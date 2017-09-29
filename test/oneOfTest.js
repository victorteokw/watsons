const watsons = require('../index');
const assert = require('assert');

describe("Watsons", function() {
  describe("validation", function() {

    describe("When validating one of, ", function() {
      it("not throw if includes.", function() {
        const obj = {
          sex: "female"
        };
        const checker = {
          sex: watsons.oneOf(["male", "female"])
        };
        watsons.validate(obj, checker);
      });

      it("throw if not includes.", function() {
        assert.throws(function() {
          const obj = {
            sex: "malformatted"
          };
          const checker = {
            sex: watsons.oneOf(["male", "female"])
          };
          watsons.validate(obj, checker);
        }, /Value at key path 'sex' should be one of \[male,female\], but it is 'malformatted'./);

      });
    });
  });
});

const watsons = require('../index');
const assert = require('assert');

describe("Watsons", function() {
  describe("valid", function() {
    it("returns true when valid.", function() {
      const obj = {
        sex: "female"
      };
      const checker = {
        sex: watsons.oneOf(["male", "female"])
      };
      assert(watsons.valid(obj, checker) === true);
    });

    it("returns false when invalid.", function() {
      const obj = {
        sex: "malformatted"
      };
      const checker = {
        sex: watsons.oneOf(["male", "female"])
      };
      assert(watsons.valid(obj, checker) === false);
    });
  });
});

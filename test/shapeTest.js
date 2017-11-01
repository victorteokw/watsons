const watsons = require('../index');
const assert = require('assert');

describe("Watsons", function() {
  describe("validation", function() {

    describe("When validating string, ", function() {
      it("not throw if string value satisfied.", function() {
        const checker = {
          stringValue: watsons.string
        };
        const object = {
          stringValue: "this is a string"
        };
        watsons.validate(object, checker);
      });
      it("throw if string value not satisfied.", function() {
        assert.throws(function(){
          const checker = {
            stringValue: watsons.string
          };
          const object = {
            stringValue: 234
          };
          watsons.validate(object, checker);
        }, /Value at key path 'stringValue' should be 'string'\./);
      });
    });

    describe("When validating number, ", function() {
      it("not throw if number value satisfied.", function() {
        const checker = {
          n: watsons.number
        };
        const object = {
          n: 45.67
        };
        watsons.validate(object, checker);
      });
      it("throw if number value not satisfied.", function() {
        assert.throws(function(){
          const checker = {
            n: watsons.number
          };
          const object = {
            n: []
          };
          watsons.validate(object, checker);
        }, /Value at key path 'n' should be 'number'\./);
      });
    });

    describe("When validating shape, ", function() {
      it("not throw if number value satisfied.", function() {
        const checker = {
          str: watsons.string,
          num: watsons.number,
          sha: watsons.shape({
            str2: watsons.string,
            num2: watsons.number,
            arr: watsons.arrayOf(
              watsons.number
            )
          })
        };
        const object = {
          str: "title",
          num: 2017,
          sha: {
            str2: "content",
            num2: 9,
            arr: [1, 2, 3]
          }
        };
        watsons.validate(object, checker);
      });
      it("throw if number value not satisfied.", function() {
        assert.throws(function() {
          const checker = {
            str: watsons.string.required,
            num: watsons.number,
            sha: watsons.shape({
              str2: watsons.string,
              num2: watsons.number,
              arr: watsons.arrayOf(
                watsons.number
              )
            })
          };
          const object = {
            str: "title",
            num: 2017,
            sha: {
              str2: "content",
              num2: 9,
              arr: [1, 2, "a"]
            }
          };
          watsons.validate(object, checker);
        }, /Value at key path 'sha.arr.2' should be 'number'\./);
      });
    });
  });
});

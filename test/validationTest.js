const watsons = require('../index');
const assert = require('assert');
const isEqual = require('lodash/isEqual');

describe("Watsons", function() {
  describe("validation", function() {
    it("return messages of object.", function() {
      const obj = {
        arrayOfNumbers: [1, 2, 3, 4, 5, false],
        arrayOfShapes: [{a:2}, {a:false}, {a:"malformatted"}],
        shape: {
          nestedShape: {
            key1: "some string",
            key2: "number malformatted"
          }
        },
        objectOfShapes: {
          a: {a:1},
          b: {a:2},
          c: {a:false}
        }
      };
      const checker = {
        arrayOfNumbers: watsons.arrayOf(watsons.number),
        arrayOfShapes: watsons.arrayOf(
          watsons.shape({
            a: watsons.number
          })
        ),
        shape: watsons.shape({
          nestedShape: watsons.shape({
            key1: watsons.string,
            key2: watsons.number
          })
        }),
        objectOfShapes: watsons.objectOf(
          watsons.shape({
            a: watsons.number
          })
        )
      };
      let result = {
        "arrayOfNumbers":[undefined,undefined,undefined,undefined,undefined,
          "Value at key path 'arrayOfNumbers.5' should be 'number'."],
        "arrayOfShapes":[
          undefined,
          {"a":"Value at key path 'arrayOfShapes.1.a' should be 'number'."},
          {"a":"Value at key path 'arrayOfShapes.2.a' should be 'number'."}
        ],
        "shape":{
          "nestedShape":{
            "key2":"Value at key path 'shape.nestedShape.key2' should be 'number'."
          }
        },
        "objectOfShapes":{
          "c":{
            "a":"Value at key path 'objectOfShapes.c.a' should be 'number'."
          }
        }
      };
      assert(isEqual(watsons.validation(obj, checker), result));
    });
  });
});

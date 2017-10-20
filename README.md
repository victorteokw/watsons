# watsons ![build status](https://travis-ci.org/zhangkaiyulw/watsons.svg)
JavaScript parameter validation inspired by prop-types.

## Requirements

watsons.js requires node.js v6 and above.

## Installation
``` bash
npm install watsons.js
```

## Usage

Normal usage

``` javaScript
const watsons = require('watsons.js')
const obj = {
  s: "string value",
  n: 3,
  a: [1, 2, 3, 4],
  e: "female",
  shape: {
    a: 100,
    b: [1, 2, true]
  },
  nullableString: null
}
const checker = {
  s: watsons.string,
  b: watsons.bool,
  n: watsons.number.required,
  a: watsons.arrayOf(
    watsons.number
  ),
  e: watsons.oneOf(["male", "female"]),
  shape: watsons.shape({
    a: watsons.number.required,
    b: watsons.array.required
  }),
  nullableString: watsons.oneOfType([
    watsons.string,
    watsons.null
  ]).required
}
watsons.validate(obj, checker) // will not throw
```

Extending watsons

``` javaScript
watsons.addValidator("match", function(s, keyPath, root, regexp) {
  if (!regexp.test(s)) {
    throw new WatsonsError(`String value at keyPath \
'${formatKeyPath(keyPath)}' does not match ${regexp.toString()}.`);
  }
}, true, ["string"]);

const obj = {
  a: "a"
};
const checker = {
  a: watsons.string.match(/a/)
};

watsons.validate(obj, checker); // will not throw
```

Configuration

By default, watsons checks validator dependencies, it's useful during development process. However, in production environment, it's unnecessary and not efficiency.

``` javaScript
watsons.config({checkDeps: false})
```

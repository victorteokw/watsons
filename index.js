'use strict';

const concat = require('lodash/concat');
const isNil = require('lodash/isNil');
const each = require('lodash/each');
const join = require('lodash/join');

const validators = {};

class ChainedValidator extends Object {
  constructor(validators) {
    super();
    this.validators = validators;
  }
}

const watsons = {
  addValidator: function(name, validator, acceptParams) {
    if (watsons[name] && !this.hasValidator(name)) {
      throw `Invalid validator name '${name}'.`;
    } else if (this.hasValidator(name)) {
      throw `Validator '${name}' redefined.`;
    }
    if (!acceptParams) {
      watsons[name] = new ChainedValidator([{name: name}]);
      validators[name] = validator;
      Object.defineProperty(ChainedValidator.prototype, name, {
        get: function() {
          return new ChainedValidator(concat(this.validators, {name: name}));
        }
      });
    } else {
      watsons[name] = function(params) {
        return new ChainedValidator([{name: name, params: params}]);
      };
      validators[name] = validator;

      Object.defineProperty(ChainedValidator.prototype, name, {
        get: function() {
          return function(params) {
            return new ChainedValidator(concat(this.validators, {name: name, params: params}));
          };
        }
      });
    }
  },
  hasValidator: function(name) {
    return validators.hasOwnProperty(name);
  },
  // TODO: chained validator should be handled here, not inside compound validators
  validate: function(object, schema, validator = validators.shape, keyPath = [], root = object) {
    validator(object, keyPath, root, schema);
  },
  validators: validators
};

function formatKeyPath(keyPath) {
  return join(keyPath, '.');
}

// See https://github.com/facebook/prop-types/blob/155f4cc27ae7e566bb2825edb9f4467ed1d0d2b2/factoryWithTypeCheckers.js#L459
function isSymbol(t, v) {
  // Native Symbol.
  if (t === 'symbol') {
    return true;
  }
  // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
  if (v['@@toStringTag'] === 'Symbol') {
    return true;
  }
  // Fallback for non-spec compliant Symbols which are polyfilled.
  if (typeof Symbol === 'function' && v instanceof Symbol) {
    return true;
  }
  return false;
}

// TODO: handle string, number objects
function getPrimitiveType(v) {
  let type = typeof v;
  if ((type === 'object') && Array.isArray(v)) {
    return 'array';
  }
  if (isSymbol(type, v)) {
    return 'symbol';
  }
  if (v instanceof Date) {
    return 'date';
  }
  if (v instanceof RegExp) {
    return 'regexp';
  }
  if (v === null) {
    return null;
  }
  return type;
}

watsons.addValidator("shape", function(object, keyPath, root, validators) {
  // TODO: Check additional keys not required
  each(validators, function(validator, k){
    let value = object[k];
    each(validator.validators, function(v) {
      watsons.validate(value, v.params, watsons.validators[v.name], concat(keyPath, k), root);
    });
  });
}, true);

each(['array', 'object'], function(collection) {
  watsons.addValidator(`${collection}Of`, function(value, keyPath, root, validator) {
    watsons.validate(value, undefined, watsons.validators[collection], keyPath, root);
    each(value, function(v, i) {
      each(validator.validators, function(_validator) {
        watsons.validate(v, _validator.params, watsons.validators[v.name], concat(keyPath, i), root);
      });
    });
  }, true);
});

watsons.addValidator("instanceOf", function(value, keyPath, root, kls) {
  if (!value instanceof kls) {
    throw `Value at key path ${formatKeyPath(keyPath)} should be instance of ${kls.name}.`;
  }
}, true);

// TODO: validator dependency, for example, watsons.date.before(tomorrow), before requires date to be prepended.
each(['array', 'bool', 'func', 'number', 'object', 'string', 'symbol', 'date', 'regexp'], function(expectedType){
  watsons.addValidator(expectedType, function(value, keyPath, props) {
    // Keep API simple and adjective by keeping in sync with prop-types, thus using 'func'.
    if (expectedType === 'func') expectedType = 'function';
    if (expectedType === 'bool') expectedType = 'boolean';
    if (getPrimitiveType(value) !== expectedType) {
      throw `Value at key path ${formatKeyPath(keyPath)} should be '${expectedType}'.`;
    }
  });
});

watsons.addValidator("required", function(value, keyPath, root) {
  if (isNil(value)) {
    throw `Required value at key path ${formatKeyPath(keyPath)}.`;
  }
});

watsons.addValidator("any", function(value, keyPath, root) {});

// TODO: one of validator
// TODO: one of type validator
// TODO: custom function validator

module.exports = watsons;

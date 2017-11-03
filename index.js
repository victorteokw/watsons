'use strict';

const concat = require('lodash/concat');
const isNil = require('lodash/isNil');
const each = require('lodash/each');
const join = require('lodash/join');
const keys = require('lodash/keys');
const difference = require('lodash/difference');
const includes = require('lodash/includes');
const map = require('lodash/map');
const assign = require('lodash/assign');
const last = require('lodash/last');
const dropRight = require('lodash/dropRight');
const set = require('lodash/set');

const WatsonsError = require('./lib/WatsonsError');
const WatsonsValidationError = require('./lib/WatsonsValidationError');
const WatsonsCompoundValidationError =
  require('./lib/WatsonsCompoundValidationError');
const formatKeyPath = require('./lib/formatKeyPath');

const validators = {};

const dependencies = {};

let config = {
  checkDeps: true
};

class ChainedValidator extends Object {
  constructor(validators) {
    super();
    this.validators = validators;
    if (config.checkDeps) {
      this.checkDeps();
    }
  }

  checkDeps() {
    let validatorName = last(this.validators).name;
    let requiredDeps = dependencies[validatorName];
    if (requiredDeps) {
      let chained = map(dropRight(this.validators), 'name');
      let unfulfilledDeps = difference(requiredDeps, chained);
      if (unfulfilledDeps.length !== 0) {
        throw new WatsonsError(`Unfulfilled validator dependencies \
${join(unfulfilledDeps, ', ')} for validator ${validatorName}.`);
      }
    }
  }
}

const watsons = {
  config: function(newConfig) {
    config = assign({}, config, newConfig);
  },
  addValidator: function(name, validator, acceptParams, deps) {
    if (watsons[name] && !this.hasValidator(name)) {
      throw new WatsonsError(`Invalid validator name '${name}'.`);
    } else if (this.hasValidator(name)) {
      throw new WatsonsError(`Validator '${name}' redefined.`);
    }
    if (deps) {
      dependencies[name] = deps;
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
            return new ChainedValidator(
              concat(this.validators, {name: name, params: params}));
          };
        }
      });
    }
  },
  hasValidator: function(name) {
    return validators.hasOwnProperty(name);
  },

  validate: function(object, schema, validator = watsons.shape, keyPath = [], root = object) {
    if (typeof validator === 'function') {
      validator = validator(schema);
    }
    let errorMessages = [];
    each(validator.validators, function(v) {
      try {
        validators[v.name](object, keyPath, root, v.params);
      } catch(e) {
        if (e instanceof WatsonsValidationError) {
          errorMessages.push(e.errorDescription);
        }
      }
    });
    if (errorMessages.length) {
      if ((errorMessages.length === 1) && (typeof errorMessages[0] === 'string')) {
        throw new WatsonsValidationError(errorMessages[0]);
      } else {
        throw new WatsonsCompoundValidationError(errorMessages.length === 1 ? errorMessages[0] : errorMessages);
      }
    }
  },

  valid: function(...args) {
    try {
      this.validate(...args);
    } catch (e) {
      if (e instanceof WatsonsValidationError) {
        return false;
      } else {
        throw e;
      }
    }
    return true;
  },

  validation: function(...args) {
    try {
      this.validate(...args);
    } catch (e) {
      if (e instanceof WatsonsValidationError) {
        return e.errorDescription;
      } else {
        return undefined;
      }
    }
  }
};

// See https://github.com/facebook/prop-types/blob/155f4cc27ae7e566bb2825edb9f4467ed1d0d2b2/factoryWithTypeCheckers.js#L459
function isSymbol(t, v) {
  if (v === null) {
    return false;
  }
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
  if (v === null) {
    return 'null';
  }
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
  if (object === undefined) return;
  watsons.validate(object, undefined, watsons.object);
  let errorDescriptor = {}, errorFlag;
  let unallowedKeys = difference(keys(object), keys(validators));
  if (unallowedKeys.length) {
    set(errorDescriptor, '_this.unallowedKeys', unallowedKeys);
    errorFlag = true;
  }
  each(validators, function(validator, k){
    let value = object[k], nextKeyPath = concat(keyPath, k);
    try {
      watsons.validate(value, undefined, validator, nextKeyPath, root);
    } catch(e) {
      if (e instanceof WatsonsValidationError) {
        errorFlag = true;
        set(errorDescriptor, k, e.errorDescription);
      } else {
        throw e;
      }
    }
  });
  if (errorFlag) {
    throw new WatsonsCompoundValidationError(errorDescriptor);
  }
}, true);

each(['array', 'object'], function(collection) {
  watsons.addValidator(`${collection}Of`, function(value, keyPath, root, validator) {
    if (value === undefined) return;
    watsons.validate(value, undefined, watsons[collection], keyPath, root);
    let errorDescriptor = collection === 'object' ? {} : [], errorFlag;
    each(value, function(v, i) {
      let nextKeyPath = concat(keyPath, i);
      try {
        watsons.validate(v, undefined, validator, nextKeyPath, root);
      } catch(e) {
        if (e instanceof WatsonsValidationError) {
          errorFlag = true;
          set(errorDescriptor, i, e.errorDescription);
        }
      }
    });
    if (errorFlag) {
      throw new WatsonsCompoundValidationError(errorDescriptor);
    }
  }, true);
});

watsons.addValidator("instanceOf", function(value, keyPath, root, kls) {
  if (!value instanceof kls) {
    throw new WatsonsValidationError(`Value at key path '${formatKeyPath(keyPath)}' \
should be instance of ${kls.name}.`);
  }
}, true);

// TODO: validator dependency,
//for example, watsons.date.before(tomorrow), before requires date to be prepended.
each(['array', 'bool', 'func', 'number', 'object', 'string', 'symbol', 'date', 'regexp', 'null'], function(expectedType){
  watsons.addValidator(expectedType, function(value, keyPath, root) {
    // Keep API simple and adjective by keeping in sync with prop-types, thus using 'func'.
    if (expectedType === 'func') expectedType = 'function';
    if (expectedType === 'bool') expectedType = 'boolean';
    if (value === undefined) return;
    if (getPrimitiveType(value) !== expectedType) {
      throw new WatsonsValidationError(`Value at key path '${formatKeyPath(keyPath)}' \
should be '${expectedType}'.`);
    }
  });
});

watsons.addValidator("required", function(value, keyPath, root) {
  if (value === undefined) {
    throw new WatsonsValidationError(`Required value at key path \
'${formatKeyPath(keyPath)}'.`);
  }
});

watsons.addValidator("any", function(value, keyPath, root) {});

watsons.addValidator("oneOf", function(value, keyPath, root, list) {
  if (value === undefined) return;
  if (!includes(list, value)) {
    throw new WatsonsValidationError(`Value at key path '${formatKeyPath(keyPath)}' \
should be one of [${join(list, ",")}], but it is '${value}'.`);
  }
}, true);

watsons.addValidator("oneOfType", function(value, keyPath, root, validators) {
  if (value === undefined) return;
  let passFlag = false;
  each(validators, function(v) {
    if (!passFlag) {
      try {
        watsons.validate(value, undefined, v, keyPath, root);
        passFlag = true;
      } catch(e) {
      }
    }
  });
  if (!passFlag) {
    let types = join(map(validators, "validators.0.name"), ", ");
    throw new WatsonsValidationError(`Value at key path '${formatKeyPath(keyPath)}' \
should be one of type [${types}].`);
  }
}, true);

watsons.addValidator("validateWith", function(value, keyPath, root, func) {
  if (!func(value, keyPath, root)) {
    throw new WatsonsValidationError(`Value at key path '${formatKeyPath(keyPath)}' \
not passing custom validator function.`);
  }
}, true);

watsons.addValidator("rule", function(value, keyPath, root, rule) {
  let [checker, message] = rule;
  try {
    watsons.validate(value, undefined, checker);
  } catch(e) {
    throw new WatsonsValidationError(message);
  }
}, true);

watsons.addValidator("rules", function(value, keyPath, root, rules) {
  each(rules, (rule) => {
    watsons.validate(value, rule, watsons.rule);
  });
}, true);

module.exports = watsons;

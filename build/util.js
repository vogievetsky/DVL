// Generated by CoffeeScript 1.6.2
var utilModule;

utilModule = {
  typeOf: (function() {
    var toString;

    toString = Object.prototype.toString;
    return function(v) {
      var type;

      type = toString.call(v);
      return type.substring(8, type.length - 1).toLowerCase();
    };
  })(),
  strObj: function(obj) {
    var k, keys, str, type, _i, _len;

    type = utilModule.typeOf(obj);
    if (type === 'object' || type === 'array') {
      str = [];
      keys = [];
      for (k in obj) {
        if (!obj.hasOwnProperty(k)) {
          continue;
        }
        keys.push(k);
      }
      keys.sort();
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        k = keys[_i];
        str.push(k, utilModule.strObj(obj[k]));
      }
      return str.join('|');
    }
    if (type === 'function') {
      return '&';
    }
    return String(obj);
  },
  uniq: function(array) {
    var a, seen, uniq, _i, _len;

    seen = {};
    uniq = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      a = array[_i];
      if (!seen[a]) {
        uniq.push(a);
      }
      seen[a] = 1;
    }
    return uniq;
  },
  isEqual: function(a, b, cmp) {
    var aKeys, atype, bKeys, btype, c, k, _i, _len;

    if (a === b) {
      return true;
    }
    atype = utilModule.typeOf(a);
    btype = utilModule.typeOf(b);
    if (atype !== btype) {
      return false;
    }
    if ((!a && b) || (a && !b)) {
      return false;
    }
    if (atype === 'date') {
      return a.getTime() === b.getTime();
    }
    if (a !== a && b !== b) {
      return false;
    }
    if (atype === 'regexp') {
      return a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline;
    }
    if (!(atype === 'object' || atype === 'array')) {
      return false;
    }
    if (cmp) {
      for (_i = 0, _len = cmp.length; _i < _len; _i++) {
        c = cmp[_i];
        if ((c.a === a && c.b === b) || (c.a === b && c.b === a)) {
          return true;
        }
      }
    }
    if ((a.length != null) && a.length !== b.length) {
      return false;
    }
    aKeys = [];
    for (k in a) {
      aKeys.push(k);
    }
    bKeys = [];
    for (k in b) {
      bKeys.push(k);
    }
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    cmp = cmp ? cmp.slice() : [];
    cmp.push({
      a: a,
      b: b
    });
    for (k in a) {
      if (!((b[k] != null) && utilModule.isEqual(a[k], b[k], cmp))) {
        return false;
      }
    }
    return true;
  },
  clone: function(obj) {
    var k, ret, t, v;

    t = utilModule.typeOf(obj);
    switch (t) {
      case 'array':
        return obj.slice();
      case 'object':
        ret = {};
        for (k in obj) {
          v = obj[k];
          ret[k] = v;
        }
        return ret;
      case 'date':
        return new Date(obj.getTime());
      default:
        return obj;
    }
  },
  escapeHTML: function(str) {
    return String(str).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
};

module.exports = utilModule;


function lift(fn) {
  var fn = arguments[0];
  if ('function' !== typeof fn) throw new TypeError();

  return function(/* args: to fn */) {
    var args = Array.prototype.slice.call(arguments),
        n = args.length,
        i;

    for (i = 0; i < n; i++) {
      if ('function' === typeof args[i]) {
        return function(/* args2 to function wrapper */) {
          var args2 = Array.prototype.slice.call(arguments),
              reduced = [],
              i, v;

          for (i = 0; i < n; i++) {
            v = args[i];
            reduced.push('function' === typeof v ? v.apply(this, args2) : v);
          }

          return fn.apply(null, reduced);
        };
      }
    }

    // Fell through so there are no functions in the arguments to fn -> call it!
    return fn.apply(null, args);
  };
}
;var clipId, debug, dvl, dvl_get, dvl_op, fn, k, op_to_lift, _ref;
var __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
}, __slice = Array.prototype.slice;
if ((_ref = Array.prototype.filter) != null) {
  _ref;
} else {
  Array.prototype.filter = function(fun, thisp) {
    var res, val, _i, _len;
    if (typeof fun !== 'function') {
      throw new TypeError();
    }
    res = new Array();
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      val = this[_i];
      if (fun.call(thisp, val, i, this)) {
        res.push(val);
      }
    }
    return res;
  };
};
debug = function() {
  if (!(typeof console !== "undefined" && console !== null ? console.log : void 0)) {
    return;
  }
  console.log.apply(console, arguments);
  return arguments[0];
};
dvl = {
  version: '1.0.0'
};
this.dvl = dvl;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = dvl;
  dvl.dvl = dvl;
}
(function() {
  var array_ctor, date_ctor, regex_ctor;
  array_ctor = (new Array).constructor;
  date_ctor = (new Date).constructor;
  regex_ctor = (new RegExp).constructor;
  return dvl.typeOf = function(v) {
    if (typeof v === 'object') {
      if (v === null) {
        return 'null';
      }
      if (v.constructor === array_ctor) {
        return 'array';
      }
      if (v.constructor === date_ctor) {
        return 'date';
      }
      return 'object';
    } else {
      if ((v != null ? v.constructor : void 0) === regex_ctor) {
        return 'regex';
      }
      return typeof v;
    }
  };
})();
dvl.util = {
  strObj: function(obj) {
    var k, keys, str, type, _i, _len;
    type = dvl.typeOf(obj);
    if (type === 'object' || type === 'array') {
      str = [];
      keys = [];
      for (k in obj) {
        keys.push(k);
      }
      keys.sort();
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        k = keys[_i];
        str.push(k, dvl.util.strObj(obj[k]));
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
  flip: function(array) {
    var i, map;
    map = {};
    i = 0;
    while (i < array.length) {
      map[array[i]] = i;
      i++;
    }
    return map;
  },
  getMinMax: function(input, acc) {
    var d, i, max, maxIdx, min, minIdx, v, _len;
    if (!acc) {
      acc = (function(x) {
        return x;
      });
    }
    min = +Infinity;
    max = -Infinity;
    minIdx = -1;
    maxIdx = -1;
    for (i = 0, _len = input.length; i < _len; i++) {
      d = input[i];
      v = acc(d);
      if (v < min) {
        min = v;
        minIdx = i;
      }
      if (max < v) {
        max = v;
        maxIdx = i;
      }
    }
    return {
      min: min,
      max: max,
      minIdx: minIdx,
      maxIdx: maxIdx
    };
  },
  crossDomainPost: function(url, params) {
    var clean, frame, inputs, k, post_process, v;
    frame = d3.select('body').append('iframe').style('display', 'none');
    clean = function(d) {
      return d.replace(/'/g, "\\'");
    };
    inputs = [];
    for (k in params) {
      v = params[k];
      inputs.push("<input name='" + k + "' value='" + (clean(v)) + "'/>");
    }
    post_process = frame.node().contentWindow.document;
    post_process.open();
    post_process.write("<form method='POST' action='" + url + "'>" + (inputs.join('')) + "</form>");
    post_process.write("<script>window.onload=function(){document.forms[0].submit();}</script>");
    post_process.close();
    setTimeout(frame.remove, 800);
  },
  isEqual: function(a, b, cmp) {
    var aKeys, atype, bKeys, btype, c, k, _i, _len;
    if (a === b) {
      return true;
    }
    atype = dvl.typeOf(a);
    btype = dvl.typeOf(b);
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
    if (atype === 'regex') {
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
      if (!((b[k] != null) && dvl.util.isEqual(a[k], b[k], cmp))) {
        return false;
      }
    }
    return true;
  },
  clone: function(obj) {
    var k, ret, t, v;
    t = dvl.typeOf(obj);
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
    return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
};
(function() {
  var DVLConst, DVLDef, DVLFunctionObject, bfsUpdate, bfsZero, changedInNotify, checkForCycle, collect_notify, constants, curCollectListener, curNotifyListener, curRecording, default_compare, end_notify_collect, init_notify, lastNotifyRun, levelPriorityQueue, nextObjId, registerers, start_notify_collect, toNotify, uniqById, variables, within_notify;
  nextObjId = 1;
  constants = {};
  variables = {};
  curRecording = null;
  default_compare = dvl.util.isEqual;
  DVLConst = (function() {
    function DVLConst(val) {
      this.value = val != null ? val : null;
      this.id = nextObjId;
      this.changed = false;
      constants[this.id] = this;
      nextObjId += 1;
      return this;
    }
    DVLConst.prototype.toString = function() {
      var tag;
      tag = this.n ? this.n + ':' : '';
      return "[" + this.tag + this.value + "]";
    };
    DVLConst.prototype.set = function() {
      return this;
    };
    DVLConst.prototype.setLazy = function() {
      return this;
    };
    DVLConst.prototype.update = function() {
      return this;
    };
    DVLConst.prototype.get = function() {
      return this.value;
    };
    DVLConst.prototype.getPrev = function() {
      return this.value;
    };
    DVLConst.prototype.hasChanged = function() {
      return this.changed;
    };
    DVLConst.prototype.resetChanged = function() {
      return null;
    };
    DVLConst.prototype.notify = function() {
      return null;
    };
    DVLConst.prototype.remove = function() {
      return null;
    };
    DVLConst.prototype.name = function() {
      var _ref2;
      if (arguments.length === 0) {
        return (_ref2 = this.n) != null ? _ref2 : '<anon_const>';
      } else {
        this.n = arguments[0];
        return this;
      }
    };
    DVLConst.prototype.compare = function() {
      if (arguments.length) {
        return this;
      } else {
        return default_compare;
      }
    };
    DVLConst.prototype.setGen = function() {
      return this;
    };
    DVLConst.prototype.gen = function() {
      var that;
      that = this;
      if (dvl.typeOf(this.value) === 'array') {
        return function(i) {
          return that.value[i];
        };
      } else {
        return function() {
          return that.value;
        };
      }
    };
    DVLConst.prototype.genPrev = function(i) {
      return this.gen(i);
    };
    DVLConst.prototype.len = function() {
      if (dvl.typeOf(this.value) === 'array') {
        return this.value.length;
      } else {
        return Infinity;
      }
    };
    return DVLConst;
  })();
  DVLDef = (function() {
    function DVLDef(val) {
      this.value = val != null ? val : null;
      this.id = nextObjId;
      this.prev = null;
      this.changed = false;
      this.vgen = void 0;
      this.vgenPrev = void 0;
      this.vlen = -1;
      this.lazy = null;
      this.listeners = [];
      this.changers = [];
      this.compareFn = default_compare;
      variables[this.id] = this;
      nextObjId++;
      if (curRecording) {
        curRecording.vars.push(this);
      }
      return this;
    }
    DVLDef.prototype.resolveLazy = function() {
      var val;
      if (this.lazy) {
        val = this.lazy();
        this.prev = val;
        this.value = val;
        this.lazy = null;
      }
    };
    DVLDef.prototype.toString = function() {
      var tag;
      tag = this.n ? this.n + ':' : '';
      return "[" + this.tag + this.value + "]";
    };
    DVLDef.prototype.hasChanged = function() {
      return this.changed;
    };
    DVLDef.prototype.resetChanged = function() {
      this.changed = false;
      return this;
    };
    DVLDef.prototype.set = function(val) {
      val = val != null ? val : null;
      if (!this.changed) {
        this.prev = this.value;
      }
      this.value = val;
      this.vgen = void 0;
      this.changed = true;
      this.lazy = null;
      return this;
    };
    DVLDef.prototype.setLazy = function(fn) {
      this.lazy = fn;
      this.changed = true;
      return this;
    };
    DVLDef.prototype.update = function(val) {
      if (this.comapreFn(val, this.value)) {
        return;
      }
      this.set(val);
      return dvl.notify(this);
    };
    DVLDef.prototype.get = function() {
      this.resolveLazy();
      return this.value;
    };
    DVLDef.prototype.getPrev = function() {
      this.resolveLazy();
      if (this.prev && this.changed) {
        return this.prev;
      } else {
        return this.value;
      }
    };
    DVLDef.prototype.notify = function() {
      return dvl.notify(this);
    };
    DVLDef.prototype.remove = function() {
      if (this.listeners.length > 0) {
        throw "Cannot remove variable " + this.id + " because it has listeners.";
      }
      if (this.changers.length > 0) {
        throw "Cannot remove variable " + this.id + " because it has changers.";
      }
      delete variables[this.id];
      return null;
    };
    DVLDef.prototype.name = function() {
      var _ref2;
      if (arguments.length === 0) {
        return (_ref2 = this.n) != null ? _ref2 : '<anon>';
      } else {
        this.n = arguments[0];
        return this;
      }
    };
    DVLDef.prototype.compare = function() {
      if (arguments.length) {
        this.comapreFn = arguments[0];
        return this;
      } else {
        return this.compareFn;
      }
    };
    DVLDef.prototype.setGen = function(g, l) {
      if (g === null) {
        l = 0;
      } else {
        if (l === void 0) {
          l = Infinity;
        }
      }
      if (!this.changed) {
        this.vgenPrev = this.vgen;
      }
      this.vgen = g;
      this.vlen = l;
      this.changed = true;
      return this;
    };
    DVLDef.prototype.gen = function() {
      var that;
      if (this.vgen !== void 0) {
        return this.vgen;
      } else {
        that = this;
        if (dvl.typeOf(this.value) === 'array') {
          return function(i) {
            return that.value[i];
          };
        } else {
          return function() {
            return that.value;
          };
        }
      }
    };
    DVLDef.prototype.genPrev = function() {
      if (this.vgenPrev && this.changed) {
        return this.vgenPrev;
      } else {
        return this.gen();
      }
    };
    DVLDef.prototype.len = function() {
      if (this.vlen >= 0) {
        return this.vlen;
      } else {
        if (this.value != null) {
          if (dvl.typeOf(this.value) === 'array') {
            return this.value.length;
          } else {
            return Infinity;
          }
        } else {
          return 0;
        }
      }
    };
    return DVLDef;
  })();
  dvl["const"] = function(value) {
    return new DVLConst(value);
  };
  dvl.def = function(value) {
    return new DVLDef(value);
  };
  dvl.knows = function(v) {
    return v instanceof DVLConst || v instanceof DVLDef;
  };
  dvl.wrapConstIfNeeded = function(v, name) {
    if (v === void 0) {
      v = null;
    }
    if (dvl.knows(v)) {
      return v;
    } else {
      return dvl["const"](v).name(name);
    }
  };
  dvl.wrapVarIfNeeded = function(v, name) {
    if (v === void 0) {
      v = null;
    }
    if (dvl.knows(v)) {
      return v;
    } else {
      return dvl.def(v).name(name);
    }
  };
  dvl.valueOf = function(v) {
    if (dvl.knows(v)) {
      return v.get();
    } else {
      return v != null ? v : null;
    }
  };
  registerers = {};
  uniqById = function(vs, allowConst) {
    var res, seen, v, _i, _len;
    res = [];
    if (vs) {
      seen = {};
      for (_i = 0, _len = vs.length; _i < _len; _i++) {
        v = vs[_i];
        if ((v != null) && (allowConst || (v.listeners && v.changers)) && !seen[v.id]) {
          seen[v.id] = true;
          res.push(v);
        }
      }
    }
    return res;
  };
  checkForCycle = function(fo) {
    var stack, v, visited, w, _i, _len, _ref2;
    stack = fo.depends.slice();
    visited = {};
    while (stack.length > 0) {
      v = stack.pop();
      visited[v.id] = true;
      _ref2 = v.depends;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        w = _ref2[_i];
        if (w === fo) {
          throw "circular dependancy detected around " + w.id;
        }
        if (!visited[w.id]) {
          stack.push(w);
        }
      }
    }
  };
  bfsUpdate = function(stack) {
    var nextLevel, v, w, _i, _len, _ref2;
    while (stack.length > 0) {
      v = stack.pop();
      nextLevel = v.level + 1;
      _ref2 = v.depends;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        w = _ref2[_i];
        if (w.level < nextLevel) {
          w.level = nextLevel;
          stack.push(w);
        }
      }
    }
  };
  bfsZero = function(queue) {
    var v, w, _i, _len, _ref2;
    while (queue.length > 0) {
      v = queue.shift();
      _ref2 = v.depends;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        w = _ref2[_i];
        w.level = 0;
        queue.push(w);
      }
    }
  };
  DVLFunctionObject = (function() {
    function DVLFunctionObject(id, name, ctx, fn, listen, change) {
      this.id = id;
      this.name = name;
      this.ctx = ctx;
      this.fn = fn;
      this.listen = listen;
      this.change = change;
      this.depends = [];
      this.level = 0;
      if (curRecording) {
        curRecording.fns.push(this);
      }
      return this;
    }
    DVLFunctionObject.prototype.addChange = function() {
      var l, uv, v, _i, _j, _len, _len2, _ref2;
      uv = uniqById(arguments);
      if (uv.length) {
        for (_i = 0, _len = uv.length; _i < _len; _i++) {
          v = uv[_i];
          this.change.push(v);
          v.changers.push(this);
          _ref2 = v.listeners;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            l = _ref2[_j];
            l.depends.push(this);
            this.level = Math.max(this.level, l.level + 1);
          }
        }
        checkForCycle(this);
        bfsUpdate([this]);
      }
      return this;
    };
    DVLFunctionObject.prototype.addListen = function() {
      var c, changedSave, i, uv, v, _i, _j, _k, _len, _len2, _len3, _len4, _ref2;
      uv = uniqById(arguments);
      if (uv.length) {
        for (_i = 0, _len = uv.length; _i < _len; _i++) {
          v = uv[_i];
          this.listen.push(v);
          v.listeners.push(this);
          _ref2 = v.changers;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            c = _ref2[_j];
            this.depends.push(c);
          }
        }
        checkForCycle(this);
        bfsUpdate([this]);
      }
      uv = uniqById(arguments, true);
      start_notify_collect(this);
      changedSave = [];
      for (_k = 0, _len3 = uv.length; _k < _len3; _k++) {
        v = uv[_k];
        changedSave.push(v.changed);
        v.changed = true;
      }
      this.fn.apply(this.ctx);
      for (i = 0, _len4 = uv.length; i < _len4; i++) {
        v = uv[i];
        v.changed = changedSave[i];
      }
      end_notify_collect();
      return this;
    };
    DVLFunctionObject.prototype.remove = function() {
      var cv, lf, queue, v, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref2, _ref3, _ref4, _ref5;
      delete registerers[this.id];
      bfsZero([this]);
      queue = [];
      _ref2 = this.change;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        cv = _ref2[_i];
        _ref3 = cv.listeners;
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          lf = _ref3[_j];
          queue.push(lf);
          lf.depends.splice(lf.depends.indexOf(this), 1);
        }
      }
      _ref4 = this.change;
      for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
        v = _ref4[_k];
        v.changers.splice(v.changers.indexOf(this), 1);
      }
      _ref5 = this.listen;
      for (_l = 0, _len4 = _ref5.length; _l < _len4; _l++) {
        v = _ref5[_l];
        v.listeners.splice(v.listeners.indexOf(this), 1);
      }
      bfsUpdate(this.depends);
      this.change = this.listen = this.depends = null;
    };
    return DVLFunctionObject;
  })();
  dvl.register = function(_arg) {
    var c, cf, change, changedSave, ctx, cv, fn, fo, force, i, id, l, lf, listen, listenConst, lv, name, noRun, v, _i, _j, _k, _l, _len, _len10, _len11, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _ref2, _ref3;
    ctx = _arg.ctx, fn = _arg.fn, listen = _arg.listen, change = _arg.change, name = _arg.name, force = _arg.force, noRun = _arg.noRun;
    if (curNotifyListener) {
      throw 'cannot call register from within a notify';
    }
    if (typeof fn !== 'function') {
      throw 'fn must be a function';
    }
    if (dvl.typeOf(listen) !== 'array') {
      listen = [listen];
    }
    if (dvl.typeOf(change) !== 'array') {
      change = [change];
    }
    listenConst = [];
    if (listen) {
      for (_i = 0, _len = listen.length; _i < _len; _i++) {
        v = listen[_i];
        if ((v != null ? v.id : void 0) && constants[v.id]) {
          listenConst.push(v);
        }
      }
    }
    listen = uniqById(listen);
    change = uniqById(change);
    if (listen.length !== 0 || change.length !== 0 || force) {
      id = ++nextObjId;
      fo = new DVLFunctionObject(id, name || 'fn', ctx, fn, listen, change);
      for (_j = 0, _len2 = listen.length; _j < _len2; _j++) {
        v = listen[_j];
        if (!v) {
          throw "No such DVL variable " + id + " in listeners";
        }
        v.listeners.push(fo);
      }
      for (_k = 0, _len3 = change.length; _k < _len3; _k++) {
        v = change[_k];
        if (!v) {
          throw "No such DVL variable " + id + " in changers";
        }
        v.changers.push(fo);
      }
      for (_l = 0, _len4 = change.length; _l < _len4; _l++) {
        cv = change[_l];
        _ref2 = cv.listeners;
        for (_m = 0, _len5 = _ref2.length; _m < _len5; _m++) {
          lf = _ref2[_m];
          lf.depends.push(fo);
          fo.level = Math.max(fo.level, lf.level + 1);
        }
      }
      for (_n = 0, _len6 = listen.length; _n < _len6; _n++) {
        lv = listen[_n];
        _ref3 = lv.changers;
        for (_o = 0, _len7 = _ref3.length; _o < _len7; _o++) {
          cf = _ref3[_o];
          fo.depends.push(cf);
        }
      }
      registerers[id] = fo;
      checkForCycle(fo);
      bfsUpdate([fo]);
    }
    if (!noRun) {
      changedSave = [];
      for (i = 0, _len8 = listen.length; i < _len8; i++) {
        l = listen[i];
        changedSave[i] = l.changed;
        l.changed = true;
      }
      for (_p = 0, _len9 = listenConst.length; _p < _len9; _p++) {
        l = listenConst[_p];
        l.changed = true;
      }
      start_notify_collect(fo);
      fn.apply(ctx);
      end_notify_collect();
      for (i = 0, _len10 = changedSave.length; i < _len10; i++) {
        c = changedSave[i];
        listen[i].changed = c;
      }
      for (_q = 0, _len11 = listenConst.length; _q < _len11; _q++) {
        l = listenConst[_q];
        l.changed = false;
      }
    }
    return fo;
  };
  dvl.clearAll = function() {
    var k, l, v;
    for (k in registerers) {
      l = registerers[k];
      l.listen = l.change = l.depends = null;
    }
    for (k in variables) {
      v = variables[k];
      v.listeners = v.changers = null;
    }
    nextObjId = 1;
    constants = {};
    variables = {};
    registerers = {};
  };
  levelPriorityQueue = (function() {
    var compare, queue, sorted;
    queue = [];
    sorted = true;
    compare = function(a, b) {
      var levelDiff;
      levelDiff = a.level - b.level;
      if (levelDiff === 0) {
        return b.id - a.id;
      } else {
        return levelDiff;
      }
    };
    return {
      push: function(l) {
        queue.push(l);
        sorted = false;
      },
      shift: function() {
        if (!sorted) {
          queue.sort(compare);
          sorted = true;
        }
        return queue.pop();
      },
      length: function() {
        return queue.length;
      }
    };
  })();
  curNotifyListener = null;
  curCollectListener = null;
  changedInNotify = null;
  lastNotifyRun = null;
  toNotify = null;
  start_notify_collect = function(listener) {
    toNotify = [];
    curCollectListener = listener;
    dvl.notify = collect_notify;
  };
  end_notify_collect = function() {
    curCollectListener = null;
    dvl.notify = init_notify;
    dvl.notify.apply(null, toNotify);
    toNotify = null;
  };
  collect_notify = function() {
    var v, _i, _len;
    if (!curCollectListener) {
      throw 'bad stuff happened collect';
    }
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      v = arguments[_i];
      if (!variables[v.id]) {
        continue;
      }
      if (__indexOf.call(curCollectListener.change, v) < 0) {
        throw "changed unregisterd object " + v.id;
      }
      toNotify.push(v);
    }
  };
  within_notify = function() {
    var l, v, _i, _j, _len, _len2, _ref2;
    if (!curNotifyListener) {
      throw 'bad stuff happened within';
    }
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      v = arguments[_i];
      if (!variables[v.id]) {
        continue;
      }
      if (__indexOf.call(curNotifyListener.change, v) < 0) {
        throw "changed unregisterd object " + v.id;
      }
      changedInNotify.push(v);
      lastNotifyRun.push(v.id);
      _ref2 = v.listeners;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        l = _ref2[_j];
        if (!l.visited) {
          levelPriorityQueue.push(l);
        }
      }
    }
  };
  init_notify = function() {
    var l, v, visitedListener, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref2;
    if (curNotifyListener) {
      throw 'bad stuff happened init';
    }
    lastNotifyRun = [];
    visitedListener = [];
    changedInNotify = [];
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      v = arguments[_i];
      if (!variables[v.id]) {
        continue;
      }
      changedInNotify.push(v);
      lastNotifyRun.push(v.id);
      _ref2 = v.listeners;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        l = _ref2[_j];
        levelPriorityQueue.push(l);
      }
    }
    dvl.notify = within_notify;
    while (levelPriorityQueue.length() > 0) {
      curNotifyListener = levelPriorityQueue.shift();
      if (curNotifyListener.visited) {
        continue;
      }
      curNotifyListener.visited = true;
      visitedListener.push(curNotifyListener);
      lastNotifyRun.push(curNotifyListener.id);
      curNotifyListener.fn.apply(curNotifyListener.ctx);
    }
    curNotifyListener = null;
    dvl.notify = init_notify;
    for (_k = 0, _len3 = changedInNotify.length; _k < _len3; _k++) {
      v = changedInNotify[_k];
      v.resetChanged();
    }
    for (_l = 0, _len4 = visitedListener.length; _l < _len4; _l++) {
      l = visitedListener[_l];
      l.visited = false;
    }
  };
  dvl.notify = init_notify;
  dvl.startRecording = function() {
    if (curRecording) {
      throw "already recording";
    }
    return curRecording = {
      fns: [],
      vars: []
    };
  };
  dvl.stopRecording = function() {
    var rec;
    if (!curRecording) {
      throw "not recording";
    }
    rec = curRecording;
    curRecording = null;
    rec.remove = function() {
      var f, v, _i, _j, _len, _len2, _ref2, _ref3;
      _ref2 = rec.fns;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        f = _ref2[_i];
        f.remove();
      }
      _ref3 = rec.vars;
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        v = _ref3[_j];
        v.remove();
      }
    };
    return rec;
  };
  dvl.graphToDot = function(lastTrace, showId) {
    var color, dot, execOrder, fnName, id, k, l, level, levels, nameMap, pos, v, varName, w, _i, _j, _k, _len, _len2, _len3, _name, _ref2, _ref3;
    execOrder = {};
    if (lastTrace && lastNotifyRun) {
      for (pos in lastNotifyRun) {
        id = lastNotifyRun[pos];
        execOrder[id] = pos;
      }
    }
    nameMap = {};
    for (k in registerers) {
      l = registerers[k];
      fnName = l.id.replace(/\n/g, '');
      fnName = fnName + ' (' + l.level + ')';
      fnName = '"' + fnName + '"';
      nameMap[l.id] = fnName;
    }
    for (id in variables) {
      v = variables[id];
      varName = id.replace(/\n/g, '');
      varName = '"' + varName + '"';
      nameMap[id] = varName;
    }
    dot = [];
    dot.push('digraph G {');
    dot.push('  rankdir=LR;');
    levels = [];
    for (id in variables) {
      v = variables[id];
      color = execOrder[id] ? 'red' : 'black';
      dot.push("  " + nameMap[id] + " [color=" + color + "];");
    }
    for (k in registerers) {
      l = registerers[k];
      levels[_name = l.level] || (levels[_name] = []);
      levels[l.level].push(nameMap[l.id]);
      color = execOrder[l.id] ? 'red' : 'black';
      dot.push("  " + nameMap[l.id] + " [shape=box,color=" + color + "];");
      _ref2 = l.listen;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        v = _ref2[_i];
        color = execOrder[v.id] && execOrder[l.id] ? 'red' : 'black';
        dot.push("  " + nameMap[v.id] + " -> " + nameMap[l.id] + " [color=" + color + "];");
      }
      _ref3 = l.change;
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        w = _ref3[_j];
        color = execOrder[l.id] && execOrder[w.id] ? 'red' : 'black';
        dot.push("  " + nameMap[l.id] + " -> " + nameMap[w.id] + " [color=" + color + "];");
      }
    }
    for (_k = 0, _len3 = levels.length; _k < _len3; _k++) {
      level = levels[_k];
      dot.push('{ rank = same; ' + level.join('; ') + '; }');
    }
    dot.push('}');
    return dot.join('\n');
  };
  dvl.postGraph = function(file, showId) {
    var g;
    file || (file = 'dvl_graph');
    g = dvl.graphToDot(false, showId);
    dvl.util.crossDomainPost('http://localhost:8124/' + file, {
      graph: JSON.stringify(g)
    });
  };
  return dvl.postLatest = function(file, showId) {
    var g;
    file || (file = 'dvl_graph_latest');
    g = dvl.graphToDot(true, showId);
    dvl.util.crossDomainPost('http://localhost:8124/' + file, {
      graph: JSON.stringify(g)
    });
  };
})();
dvl.alwaysLazy = function(v, fn) {
  return function() {
    v.setLazy(fn);
    return dvl.notify(v);
  };
};
dvl.zero = dvl["const"](0).name('zero');
dvl["null"] = dvl["const"](null).name('null');
dvl.ident = function(x) {
  return x;
};
dvl.identity = dvl["const"](dvl.ident).name('identity');
dvl.acc = function(column) {
  var acc, makeAcc;
  column = dvl.wrapConstIfNeeded(column);
  acc = dvl.def().name("acc");
  makeAcc = function() {
    var col;
    col = column.get();
    if (col != null) {
      acc.set(function(d) {
        return d[col];
      });
    } else {
      acc.set(null);
    }
    return dvl.notify(acc);
  };
  dvl.register({
    fn: makeAcc,
    listen: [column],
    change: [acc],
    name: 'make_acc'
  });
  return acc;
};
dvl.debug = function() {
  var dbgPrint, genStr, note, obj;
  genStr = function(o) {
    if (o != null ? o.vgen : void 0) {
      return "[gen:" + (o.len()) + "]";
    } else {
      return '';
    }
  };
  if (arguments.length === 1) {
    obj = dvl.wrapConstIfNeeded(arguments[0]);
    note = obj.name + ':';
  } else {
    note = arguments[0];
    obj = dvl.wrapConstIfNeeded(arguments[1]);
  }
  dbgPrint = function() {
    return debug(note, obj.get(), genStr(obj));
  };
  dvl.register({
    fn: dbgPrint,
    listen: [obj],
    name: 'debug'
  });
  return obj;
};
dvl.apply = function() {
  var allowNull, args, fn, invalid, name, out, update, _ref2, _ref3;
  switch (arguments.length) {
    case 1:
      _ref2 = arguments[0], fn = _ref2.fn, args = _ref2.args, out = _ref2.out, name = _ref2.name, invalid = _ref2.invalid, allowNull = _ref2.allowNull, update = _ref2.update;
      break;
    case 2:
      args = arguments[0], fn = arguments[1];
      break;
    case 3:
      args = arguments[0], _ref3 = arguments[1], out = _ref3.out, name = _ref3.name, invalid = _ref3.invalid, allowNull = _ref3.allowNull, update = _ref3.update, fn = arguments[2];
      break;
    default:
      throw "incorect number of arguments";
  }
  fn = dvl.wrapConstIfNeeded(fn || dvl.identity);
  if (dvl.typeOf(args) !== 'array') {
    args = [args];
  }
  args = args.map(dvl.wrapConstIfNeeded);
  invalid = dvl.wrapConstIfNeeded(invalid != null ? invalid : null);
  out = dvl.wrapVarIfNeeded(out != null ? out : invalid.get(), name || 'apply_out');
  dvl.register({
    name: (name || 'apply') + '_fn',
    listen: args.concat([fn, invalid]),
    change: [out],
    fn: function() {
      var a, f, nulls, r, send, v, _i, _len;
      f = fn.get();
      if (f == null) {
        return;
      }
      send = [];
      nulls = false;
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        a = args[_i];
        v = a.get();
        if (v == null) {
          nulls = true;
        }
        send.push(v);
      }
      if (!nulls || allowNull) {
        r = f.apply(null, send);
        if (r === void 0) {
          return;
        }
      } else {
        r = invalid.get();
      }
      if (update) {
        return out.update(r);
      } else {
        return out.set(r).notify();
      }
    }
  });
  return out;
};
dvl.random = function(options) {
  var gen, int, max, min, random, walk;
  min = options.min || 0;
  max = options.max || min + 10;
  int = options.integer;
  walk = options.walk;
  random = dvl.def((max - min) / 2, options.name || 'random');
  gen = function() {
    var r, scale;
    if (walk && walk > 0) {
      scale = walk * Math.abs(max - min);
      r = random.get() + scale * (2 * Math.random() - 1);
      if (r < min) {
        r = min;
      }
      if (max < r) {
        r = max;
      }
    } else {
      r = Math.random() * (max - min) + min;
    }
    if (int) {
      r = Math.floor(r);
    }
    random.set(r);
    return dvl.notify(random);
  };
  if (options.interval) {
    setInterval(gen, options.interval);
  }
  gen();
  return random;
};
dvl.arrayTick = function(data, options) {
  var gen, move, out, point;
  if (!data) {
    throw 'dvl.arrayTick: no data';
  }
  data = dvl.wrapConstIfNeeded(data);
  point = options.start || 0;
  move = options.move || 1;
  out = dvl.def(null, 'array_tick_data');
  gen = function() {
    var d, len, v;
    d = data.get();
    len = d.length;
    if (len > 0) {
      v = d[point % len];
      point = (point + move) % len;
      out.set(v);
      return dvl.notify(out);
    }
  };
  if (options.interval) {
    setInterval(gen, options.interval);
  }
  gen();
  return out;
};
dvl.recorder = function(options) {
  var array, data, fn, i, max, record;
  array = dvl.wrapVarIfNeeded(options.array || [], options.name || 'recorder_array');
  data = options.data;
  fn = dvl.wrapConstIfNeeded(options.fn || dvl.identity);
  if (!dvl.knows(data)) {
    throw 'it does not make sense not to have data';
  }
  max = dvl.wrapConstIfNeeded(options.max || +Infinity);
  i = 0;
  record = function() {
    var d, m, o, _array;
    d = fn.get()(data.get());
    m = max.get();
    if (d != null) {
      if (options.value) {
        o = {};
        o[options.value] = d;
        d = o;
      }
      if (options.index) {
        d[options.index] = i;
      }
      if (options.timestamp) {
        d[options.timestamp] = new Date();
      }
      _array = array.get();
      _array.push(d);
      while (m < _array.length) {
        _array.shift();
      }
      array.set(_array).notify();
      return i += 1;
    }
  };
  dvl.register({
    fn: record,
    listen: [data],
    change: [array],
    name: 'recorder'
  });
  return array;
};
(function() {
  var ajaxManagers, makeManager, nextGroupId, normalRequester, outstanding;
  outstanding = dvl.def(0, 'json_outstanding');
  ajaxManagers = [];
  normalRequester = null;
  makeManager = function() {
    var addHoock, fo, getData, initQueue, inputChange, makeRequest, maybeDone, nextQueryId, queries;
    nextQueryId = 0;
    initQueue = [];
    queries = {};
    maybeDone = function(request) {
      var notify, q, _i, _j, _len, _len2, _ref2;
      for (_i = 0, _len = request.length; _i < _len; _i++) {
        q = request[_i];
        if (q.status !== 'ready') {
          return;
        }
      }
      notify = [];
      for (_j = 0, _len2 = request.length; _j < _len2; _j++) {
        q = request[_j];
        if (q.hasOwnProperty('resVal')) {
          q.res.set((_ref2 = q.resVal) != null ? _ref2 : null);
          notify.push(q.res);
          q.status = '';
          delete q.resVal;
        }
      }
      return dvl.notify.apply(null, notify);
    };
    getData = function(err, resVal) {
      var q;
      q = this.q;
      if (this.url === q.url.get() && (this.method === 'GET' || (this.data === q.data.get() && this.dataFn === q.dataFn.get()))) {
        if (err) {
          q.resVal = null;
          if (q.onError) {
            q.onError(err);
          }
        } else {
          q.resVal = this.url ? resVal : null;
        }
      }
      q.status = 'ready';
      q.curAjax = null;
      return maybeDone(this.request);
    };
    makeRequest = function(q, request) {
      var ctx, _data, _dataFn, _dataType, _method, _url;
      _url = q.url.get();
      _data = q.data.get();
      _dataFn = q.dataFn.get();
      _method = q.method.get();
      _dataType = q.type.get();
      ctx = {
        q: q,
        request: request,
        url: _url,
        data: _data,
        dataFn: _dataFn,
        method: _method
      };
      if (q.curAjax) {
        q.curAjax.abort();
      }
      if ((_url != null) && (_method === 'GET' || ((_data != null) && (_dataFn != null))) && _dataType) {
        if (q.invalidOnLoad.get()) {
          q.res.update(null);
        }
        return q.curAjax = q.requester.request({
          url: _url,
          data: _data,
          dataFn: _dataFn,
          method: _method,
          dataType: _dataType,
          contentType: q.contentType.get(),
          processData: q.processData.get(),
          fn: q.fn,
          outstanding: outstanding,
          complete: function(err, data) {
            return getData.call(ctx, err, data);
          }
        });
      } else {
        return getData.call(ctx, null, null);
      }
    };
    inputChange = function() {
      var bundle, id, q, _i, _j, _len, _len2;
      bundle = [];
      for (id in queries) {
        q = queries[id];
        if (!(q.url.hasChanged() || q.data.hasChanged() || q.dataFn.hasChanged())) {
          continue;
        }
        if (q.status === 'virgin') {
          if (q.url.get()) {
            initQueue.push(q);
            q.status = 'requesting';
            makeRequest(q, initQueue);
          } else {
            q.status = '';
          }
        } else {
          bundle.push(q);
        }
      }
      if (bundle.length > 0) {
        for (_i = 0, _len = bundle.length; _i < _len; _i++) {
          q = bundle[_i];
          q.status = 'requesting';
        }
        for (_j = 0, _len2 = bundle.length; _j < _len2; _j++) {
          q = bundle[_j];
          makeRequest(q, bundle);
        }
      }
    };
    fo = null;
    addHoock = function(url, data, dataFn, ret) {
      if (fo) {
        fo.addListen(url, data, dataFn);
        fo.addChange(ret);
      } else {
        fo = dvl.register({
          name: 'ajax_man',
          listen: [url, data],
          change: [ret, outstanding],
          fn: inputChange,
          force: true
        });
      }
    };
    return function(url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, requester, name) {
      var q, res;
      nextQueryId++;
      res = dvl.def(null, name);
      q = {
        id: nextQueryId,
        url: url,
        data: data,
        dataFn: dataFn,
        method: method,
        contentType: contentType,
        processData: processData,
        res: res,
        status: 'virgin',
        type: type,
        requester: requester,
        onError: onError,
        invalidOnLoad: invalidOnLoad
      };
      if (fn) {
        q.fn = fn;
      }
      queries[q.id] = q;
      addHoock(url, data, dataFn, res);
      return res;
    };
  };
  dvl.ajax = function(_arg) {
    var contentType, data, dataFn, fn, groupId, invalidOnLoad, method, name, onError, processData, requester, type, url;
    url = _arg.url, data = _arg.data, dataFn = _arg.dataFn, method = _arg.method, type = _arg.type, contentType = _arg.contentType, processData = _arg.processData, fn = _arg.fn, invalidOnLoad = _arg.invalidOnLoad, onError = _arg.onError, groupId = _arg.groupId, requester = _arg.requester, name = _arg.name;
    if (!url) {
      throw 'it does not make sense to not have a url';
    }
    if (fn && dvl.knows(fn)) {
      throw 'the fn function must be non DVL variable';
    }
    url = dvl.wrapConstIfNeeded(url);
    data = dvl.wrapConstIfNeeded(data);
    dataFn = dvl.wrapConstIfNeeded(dataFn || dvl.indentity);
    method = dvl.wrapConstIfNeeded(method || 'GET');
    type = dvl.wrapConstIfNeeded(type || 'json');
    contentType = dvl.wrapConstIfNeeded(contentType || 'application/x-www-form-urlencoded');
    processData = dvl.wrapConstIfNeeded(processData != null ? processData : true);
    invalidOnLoad = dvl.wrapConstIfNeeded(invalidOnLoad || false);
    name || (name = 'ajax_data');
    if (groupId == null) {
      groupId = dvl.ajax.getGroupId();
    }
    ajaxManagers[groupId] || (ajaxManagers[groupId] = makeManager());
    if (!requester) {
      normalRequester || (normalRequester = dvl.ajax.requester.normal());
      requester = normalRequester;
    }
    return ajaxManagers[groupId](url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, requester, name);
  };
  dvl.json = dvl.ajax;
  dvl.ajax.outstanding = outstanding;
  nextGroupId = 0;
  return dvl.ajax.getGroupId = function() {
    var id;
    id = nextGroupId;
    nextGroupId++;
    return id;
  };
})();
dvl.ajax.requester = {
  normal: function() {
    return {
      request: function(_arg) {
        var ajax, complete, contentType, data, dataFn, dataType, dataVal, fn, getData, getError, method, outstanding, processData, url;
        url = _arg.url, data = _arg.data, dataFn = _arg.dataFn, method = _arg.method, dataType = _arg.dataType, contentType = _arg.contentType, processData = _arg.processData, fn = _arg.fn, outstanding = _arg.outstanding, complete = _arg.complete;
        dataVal = method !== 'GET' ? dataFn(data) : null;
        getData = function(resVal) {
          var ajax, ctx;
          if (fn) {
            ctx = {
              url: url,
              data: data
            };
            resVal = fn.call(ctx, resVal);
          }
          ajax = null;
          return complete(null, resVal);
        };
        getError = function(xhr, textStatus) {
          var ajax;
          if (textStatus === "abort") {
            return;
          }
          ajax = null;
          return complete(textStatus, null);
        };
        ajax = jQuery.ajax({
          url: url,
          data: dataVal,
          type: method,
          dataType: dataType,
          contentType: contentType,
          processData: processData,
          success: getData,
          error: getError,
          complete: function() {
            return outstanding.set(outstanding.get() - 1).notify();
          },
          context: {
            url: url
          }
        });
        outstanding.set(outstanding.get() + 1).notify();
        return {
          abort: function() {
            if (ajax) {
              ajax.abort();
              ajax = null;
            }
          }
        };
      }
    };
  },
  cache: function(_arg) {
    var cache, count, max, timeout, trim, _ref2;
    _ref2 = _arg != null ? _arg : {}, max = _ref2.max, timeout = _ref2.timeout;
    max = dvl.wrapConstIfNeeded(max || 100);
    timeout = dvl.wrapConstIfNeeded(timeout || 30 * 60 * 1000);
    cache = {};
    count = 0;
    trim = function() {
      var cutoff, d, m, newCache, oldestQuery, oldestTime, q, tout, _results;
      tout = timeout.get();
      if (tout > 0) {
        cutoff = Date.now() - tout;
        newCache = {};
        for (q in cache) {
          d = cache[q];
          if (cutoff < d.time) {
            newCache[q] = d;
          }
        }
        cache = newCache;
      }
      m = max.get();
      _results = [];
      while (m < count) {
        oldestQuery = null;
        oldestTime = Infinity;
        for (q in cache) {
          d = cache[q];
          if (d.time < oldestTime) {
            oldestTime = d.time;
            oldestQuery = q;
          }
        }
        delete cache[oldestQuery];
        _results.push(count--);
      }
      return _results;
    };
    dvl.register({
      fn: trim,
      listen: [max, timeout],
      name: 'cache_trim'
    });
    return {
      request: function(_arg2) {
        var added, c, complete, contentType, data, dataFn, dataType, dataVal, fn, getData, getError, key, method, outstanding, processData, url;
        url = _arg2.url, data = _arg2.data, dataFn = _arg2.dataFn, method = _arg2.method, dataType = _arg2.dataType, contentType = _arg2.contentType, processData = _arg2.processData, fn = _arg2.fn, outstanding = _arg2.outstanding, complete = _arg2.complete;
        dataVal = method !== 'GET' ? dataFn(data) : null;
        key = [url, dvl.util.strObj(dataVal), method, dataType, contentType, processData].join('@@');
        c = cache[key];
        added = false;
        if (!c) {
          cache[key] = c = {
            time: Date.now(),
            waiting: [complete]
          };
          added = true;
          count++;
          trim();
          getData = function(resVal) {
            var cb, ctx, _i, _len, _ref3;
            if (fn) {
              ctx = {
                url: url,
                data: data
              };
              resVal = fn.call(ctx, resVal);
            }
            c.ajax = null;
            c.resVal = resVal;
            _ref3 = c.waiting;
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              cb = _ref3[_i];
              cb(null, resVal);
            }
            delete c.waiting;
          };
          getError = function(xhr, textStatus) {
            var cb, _i, _len, _ref3;
            if (textStatus === "abort") {
              return;
            }
            c.ajax = null;
            delete cache[key];
            count--;
            _ref3 = c.waiting;
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              cb = _ref3[_i];
              cb(textStatus, null);
            }
            delete c.waiting;
          };
          c.ajax = jQuery.ajax({
            url: url,
            data: dataVal,
            type: method,
            dataType: dataType,
            contentType: contentType,
            processData: processData,
            success: getData,
            error: getError,
            complete: function() {
              return outstanding.set(outstanding.get() - 1).notify();
            }
          });
          outstanding.set(outstanding.get() + 1).notify();
        }
        if (c.resVal) {
          complete(null, c.resVal);
          return {
            abort: function() {}
          };
        } else {
          if (!added) {
            c.waiting.push(complete);
          }
          return {
            abort: function() {
              if (!c.waiting) {
                return;
              }
              c.waiting = c.waiting.filter(function(l) {
                return l !== complete;
              });
              if (c.waiting.length === 0 && c.ajax) {
                c.ajax.abort();
                c.ajax = null;
                delete cache[key];
                count--;
              }
            }
          };
        }
      },
      clear: function() {
        cache = {};
        count = 0;
      }
    };
  }
};
dvl.snap = function(_arg) {
  var acc, data, name, out, trim, updateSnap, value;
  data = _arg.data, acc = _arg.acc, value = _arg.value, trim = _arg.trim, name = _arg.name;
  if (!data) {
    throw 'No data given';
  }
  acc = dvl.wrapConstIfNeeded(acc || dvl.identity);
  value = dvl.wrapConstIfNeeded(value);
  trim = dvl.wrapConstIfNeeded(trim || false);
  name || (name = 'snaped_data');
  out = dvl.def(null).name(name);
  updateSnap = function() {
    var a, d, dist, ds, i, minDatum, minDist, minIdx, v, _len;
    ds = data.get();
    a = acc.get();
    v = value.get();
    if (ds && a && v) {
      if (trim.get() && ds.length !== 0 && (v < a(ds[0]) || a(ds[ds.length - 1]) < v)) {
        minIdx = -1;
      } else {
        minIdx = -1;
        minDist = Infinity;
        if (ds) {
          for (i = 0, _len = ds.length; i < _len; i++) {
            d = ds[i];
            dist = Math.abs(a(d) - v);
            if (dist < minDist) {
              minDist = dist;
              minIdx = i;
            }
          }
        }
      }
      minDatum = minIdx < 0 ? null : ds[minIdx];
      if (out.get() !== minDatum) {
        out.set(minDatum);
      }
    } else {
      out.set(null);
    }
    return dvl.notify(out);
  };
  dvl.register({
    fn: updateSnap,
    listen: [data, acc, value, trim],
    change: [out],
    name: name + '_maker'
  });
  return out;
};
dvl.hasher = function(obj) {
  var updateHash;
  updateHash = function() {
    var h;
    h = obj.get();
    if (window.location.hash !== h) {
      return window.location.hash = h;
    }
  };
  dvl.register({
    fn: updateHash,
    listen: [obj],
    name: 'hash_changer'
  });
};
dvl.data = {};
dvl.data.min = function(data, acc) {
  acc || (acc = dvl.identity);
  return dvl.apply({
    args: [data, acc],
    update: true,
    fn: function(data, acc) {
      return d3.min(data, acc);
    }
  });
};
dvl.data.max = function(data, acc) {
  acc || (acc = dvl.identity);
  return dvl.apply({
    args: [data, acc],
    update: true,
    fn: function(data, acc) {
      return d3.max(data, acc);
    }
  });
};
dvl.scale = {};
(function() {
  dvl.scale.linear = function(options) {
    var change, dom, domainFrom, domainTo, formatRef, invertRef, listenData, makeScale, makeScaleFn, makeScaleFnEmpty, makeScaleFnSingle, name, numTicks, optDomain, padding, rangeFrom, rangeTo, scaleRef, ticksRef, updateData, _i, _len;
    if (!options) {
      throw 'no options in scale';
    }
    name = options.name || 'linear_scale';
    rangeFrom = options.rangeFrom || 0;
    rangeFrom = dvl.wrapConstIfNeeded(rangeFrom);
    rangeTo = options.rangeTo || 0;
    rangeTo = dvl.wrapConstIfNeeded(rangeTo);
    padding = options.padding || 0;
    numTicks = options.numTicks || 10;
    numTicks = dvl.wrapConstIfNeeded(numTicks);
    optDomain = options.domain;
    if (!optDomain) {
      throw 'no domain object';
    }
    switch (dvl.typeOf(optDomain)) {
      case 'array':
        if (!(optDomain.length > 0)) {
          throw 'empty domain given to scale';
        }
        break;
      case 'object':
        optDomain = [optDomain];
        break;
      default:
        throw 'invalid domian type';
    }
    domainFrom = null;
    domainTo = null;
    scaleRef = dvl.def().name(name + '_fn');
    invertRef = dvl.def().name(name + '_invert');
    ticksRef = dvl.def().name(name + '_ticks');
    formatRef = dvl.def().name(name + '_format');
    makeScale = function() {
      if (domainFrom < domainTo) {
        return makeScaleFn();
      } else if (domainFrom === domainTo) {
        return makeScaleFnSingle();
      } else {
        return makeScaleFnEmpty();
      }
    };
    makeScaleFn = function() {
      var isColor, rf, rt, s;
      isColor = typeof (rangeFrom.get()) === 'string';
      rf = rangeFrom.get();
      rt = rangeTo.get();
      if (!isColor) {
        if (rt > rf) {
          rf += padding;
          rt -= padding;
        } else {
          rf -= padding;
          rt += padding;
        }
      }
      s = pv.Scale.linear().domain(domainFrom, domainTo).range(rf, rt);
      if (isColor) {
        scaleRef.set(function(x) {
          return s(x).color;
        });
      } else {
        scaleRef.set(s);
      }
      invertRef.set(s.invert);
      ticksRef.setLazy(function() {
        return s.ticks(numTicks.get());
      });
      formatRef.set(s.tickFormat);
      dvl.notify(scaleRef, invertRef, ticksRef, formatRef);
    };
    makeScaleFnSingle = function() {
      var avg, isColor, rf, rt;
      isColor = typeof (rangeFrom.get()) === 'string';
      rf = rangeFrom.get();
      rt = rangeTo.get();
      if (!isColor) {
        if (rt > rf) {
          rf += padding;
          rt -= padding;
        } else {
          rf -= padding;
          rt += padding;
        }
      }
      avg = (rf + rt) / 2;
      scaleRef.set(function() {
        return avg;
      });
      invertRef.set(function() {
        return domainFrom;
      });
      ticksRef.set([domainFrom]);
      formatRef.set(function(x) {
        return '';
      });
      dvl.notify(scaleRef, invertRef, ticksRef, formatRef);
    };
    makeScaleFnEmpty = function() {
      scaleRef.set(null);
      invertRef.set(null);
      ticksRef.set(null);
      formatRef.set(null);
      dvl.notify(scaleRef, invertRef, ticksRef, formatRef);
    };
    updateData = function() {
      var a, acc, d0, data, dn, dom, f, max, min, mm, t, _i, _len;
      min = +Infinity;
      max = -Infinity;
      for (_i = 0, _len = optDomain.length; _i < _len; _i++) {
        dom = optDomain[_i];
        if (dom.data) {
          data = dom.data.get();
          if (data !== null) {
            acc = dom.acc || dvl.identity;
            a = acc.get();
            if (dvl.typeOf(data) !== 'array') {
              data = a(data);
              a = function(x) {
                return x;
              };
            }
            if (data.length > 0) {
              if (dom.sorted) {
                d0 = a(data[0], 0);
                dn = a(data[data.length - 1], data.length - 1);
                if (d0 < min) {
                  min = d0;
                }
                if (dn < min) {
                  min = dn;
                }
                if (max < d0) {
                  max = d0;
                }
                if (max < dn) {
                  max = dn;
                }
              } else {
                mm = dvl.util.getMinMax(data, a);
                if (mm.min < min) {
                  min = mm.min;
                }
                if (max < mm.max) {
                  max = mm.max;
                }
              }
            }
          }
        } else {
          f = dom.from.get();
          t = dom.to.get();
          if ((f != null) && (t != null)) {
            if (f < min) {
              min = f;
            }
            if (max < t) {
              max = t;
            }
          }
        }
      }
      if (options.anchor) {
        if (0 < min) {
          min = 0;
        }
        if (max < 0) {
          max = 0;
        }
      }
      if (options.scaleMin !== void 0) {
        min *= options.scaleMin;
      }
      if (options.scaleMax !== void 0) {
        max *= options.scaleMax;
      }
      if (min <= max) {
        if (domainFrom !== min || domainTo !== max) {
          domainFrom = min;
          domainTo = max;
          makeScale();
        }
      } else {
        domainFrom = NaN;
        domainTo = NaN;
        makeScale();
      }
    };
    listenData = [];
    for (_i = 0, _len = optDomain.length; _i < _len; _i++) {
      dom = optDomain[_i];
      if (dom.data) {
        listenData.push(dom.data, dom.acc);
      } else {
        listenData.push(dom.from, dom.to);
      }
    }
    change = [scaleRef, invertRef, ticksRef, formatRef];
    dvl.register({
      fn: makeScale,
      listen: [rangeFrom, rangeTo, numTicks],
      change: change,
      name: name + '_range_change',
      noRun: true
    });
    dvl.register({
      fn: updateData,
      listen: listenData,
      change: change,
      name: name + '_data_change'
    });
    return {
      scale: scaleRef,
      invert: invertRef,
      ticks: ticksRef,
      format: formatRef
    };
  };
  return dvl.scale.ordinal = function(options) {
    var bandRef, domain, formatRef, makeScaleFn, makeScaleFnEmpty, name, optDomain, padding, rangeFrom, rangeTo, scaleRef, ticksRef, updateData;
    if (!options) {
      throw 'no options in scale';
    }
    name = options.name || 'ordinal_scale';
    rangeFrom = options.rangeFrom || 0;
    rangeFrom = dvl.wrapConstIfNeeded(rangeFrom);
    rangeTo = options.rangeTo || 0;
    rangeTo = dvl.wrapConstIfNeeded(rangeTo);
    padding = options.padding || 0;
    optDomain = options.domain;
    if (!optDomain) {
      throw 'no domain object';
    }
    domain = null;
    scaleRef = dvl.def(null, name + '_fn');
    ticksRef = dvl.def(null, name + '_ticks');
    formatRef = dvl.def(null, name + '_format');
    bandRef = dvl.def(0, name + '_band');
    makeScaleFn = function() {
      var rf, rt, s;
      rf = rangeFrom.get();
      rt = rangeTo.get();
      if (rt > rf) {
        rf += padding;
        rt -= padding;
      } else {
        rf -= padding;
        rt += padding;
      }
      s = pv.Scale.ordinal().domain(domain).split(rf, rt);
      scaleRef.set(s);
      ticksRef.set(domain);
      formatRef.set(s.tickFormat);
      bandRef.set(Math.abs(rt - rf) / domain.length);
      dvl.notify(scaleRef, ticksRef, formatRef, bandRef);
    };
    makeScaleFnEmpty = function() {
      scaleRef.set(null);
      ticksRef.set(null);
      formatRef.set(null);
      bandRef.set(0);
      dvl.notify(scaleRef, ticksRef, formatRef, bandRef);
    };
    updateData = function() {
      var a;
      domain = optDomain.data.get();
      if (!domain) {
        makeScaleFnEmpty();
        return;
      }
      if (optDomain.acc) {
        a = optDomain.acc.get();
        domain = domain.map(a);
      }
      if (optDomain.sort) {
        if (!(optDomain.acc || optDomain.uniq)) {
          domain = domain.slice();
        }
        domain.sort();
      }
      if (optDomain.uniq) {
        domain = dvl.util.uniq(domain);
      }
      if (domain.length > 0) {
        makeScaleFn();
      } else {
        makeScaleFnEmpty();
      }
    };
    dvl.register({
      fn: makeScaleFn,
      listen: [rangeFrom, rangeTo],
      change: [scaleRef, ticksRef, formatRef, bandRef],
      name: name + '_range_change',
      noRun: true
    });
    dvl.register({
      fn: updateData,
      listen: [optDomain.data, optDomain.acc],
      change: [scaleRef, ticksRef, formatRef, bandRef],
      name: name + '_data_change'
    });
    return {
      scale: scaleRef,
      ticks: ticksRef,
      format: formatRef,
      band: bandRef
    };
  };
})();
(function() {
  var def_data_fn, id_class_spliter;
  id_class_spliter = /(?=[#.:])/;
  def_data_fn = dvl["const"](function(d) {
    return [d];
  });
  return dvl.bind = function(args) {
    var attrList, data, html, join, k, listen, nodeType, onList, out, parent, part, parts, self, staticClass, staticId, styleList, text, transition, transitionExit, v, _i, _len, _ref2, _ref3, _ref4;
    if (!args.parent) {
      throw "'parent' not defiend";
    }
    self = args.self;
    if (typeof self !== 'string') {
      throw "'self' not defiend";
    }
    parts = self.split(id_class_spliter);
    nodeType = parts.shift();
    staticId = null;
    staticClass = [];
    for (_i = 0, _len = parts.length; _i < _len; _i++) {
      part = parts[_i];
      switch (part[0]) {
        case '#':
          staticId = part.substring(1);
          break;
        case '.':
          staticClass.push(part.substring(1));
          break;
        default:
          throw "not currently supported in 'self' (" + part + ")";
      }
    }
    staticClass = staticClass.join(' ');
    parent = dvl.wrapConstIfNeeded(args.parent);
    data = dvl.wrapConstIfNeeded(args.data || def_data_fn);
    join = dvl.wrapConstIfNeeded(args.join);
    text = args.text ? dvl.wrapConstIfNeeded(args.text) : null;
    html = args.html ? dvl.wrapConstIfNeeded(args.html) : null;
    transition = dvl.wrapConstIfNeeded(args.transition);
    transitionExit = dvl.wrapConstIfNeeded(args.transitionExit);
    listen = [parent, data, join, text, html, transition, transitionExit];
    attrList = {};
    _ref2 = args.attr;
    for (k in _ref2) {
      v = _ref2[k];
      v = dvl.wrapConstIfNeeded(v);
      if (k === 'class' && staticClass) {
        v = dvl.op.concat(v, ' ' + staticClass);
      }
      listen.push(v);
      attrList[k] = v;
    }
    if (staticClass && !attrList['class']) {
      attrList['class'] = dvl["const"](staticClass);
    }
    styleList = {};
    _ref3 = args.style;
    for (k in _ref3) {
      v = _ref3[k];
      v = dvl.wrapConstIfNeeded(v);
      listen.push(v);
      styleList[k] = v;
    }
    onList = {};
    _ref4 = args.on;
    for (k in _ref4) {
      v = _ref4[k];
      v = dvl.wrapConstIfNeeded(v);
      listen.push(v);
      onList[k] = v;
    }
    out = dvl.def(null, 'selection');
    dvl.register({
      listen: listen,
      change: [out],
      fn: function() {
        var a, add1, add2, addO, e, enter, ex, force, k, postTrans, preTrans, s, t, v, _data, _j, _join, _k, _l, _len2, _len3, _len4, _parent, _transition, _transitionExit;
        _parent = parent.get();
        if (!_parent) {
          return;
        }
        force = parent.hasChanged() || data.hasChanged() || join.hasChanged();
        _data = data.get();
        _join = join.get();
        if (_data) {
          _transition = transition.get();
          _transitionExit = transitionExit.get();
          enter = [];
          preTrans = [];
          postTrans = [];
          add1 = function(fn, v) {
            if (v.hasChanged() || force) {
              preTrans.push({
                fn: fn,
                a1: v.getPrev()
              });
              postTrans.push({
                fn: fn,
                a1: v.get()
              });
            } else {
              enter.push({
                fn: fn,
                a1: v.get()
              });
            }
          };
          add2 = function(fn, k, v) {
            if (v.hasChanged() || force) {
              enter.push({
                fn: fn,
                a1: k,
                a2: v.getPrev()
              });
              preTrans.push({
                fn: fn,
                a1: k,
                a2: v.getPrev()
              });
              postTrans.push({
                fn: fn,
                a1: k,
                a2: v.get()
              });
            } else {
              enter.push({
                fn: fn,
                a1: k,
                a2: v.get()
              });
            }
          };
          addO = function(fn, k, v) {
            if (v.hasChanged() || force) {
              preTrans.push({
                fn: fn,
                a1: k,
                a2: v.get()
              });
            } else {
              enter.push({
                fn: fn,
                a1: k,
                a2: v.get()
              });
            }
          };
          if (text) {
            add1('text', text);
          }
          if (html) {
            add1('html', html);
          }
          for (k in attrList) {
            v = attrList[k];
            add2('attr', k, v);
          }
          for (k in styleList) {
            v = styleList[k];
            add2('style', k, v);
          }
          for (k in onList) {
            v = onList[k];
            addO('on', k, v);
          }
          s = _parent.selectAll(self).data(_data, _join);
          e = s.enter().append(nodeType);
          for (_j = 0, _len2 = enter.length; _j < _len2; _j++) {
            a = enter[_j];
            e[a.fn](a.a1, a.a2);
          }
          for (_k = 0, _len3 = preTrans.length; _k < _len3; _k++) {
            a = preTrans[_k];
            s[a.fn](a.a1, a.a2);
          }
          if (_transition && (_transition.duration != null)) {
            t = s.transition();
            t.duration(_transition.duration || 1000);
            if (_transition.delay) {
              t.delay(_transition.delay);
            }
            if (_transition.ease) {
              t.ease(_transition.ease);
            }
          } else {
            t = s;
          }
          for (_l = 0, _len4 = postTrans.length; _l < _len4; _l++) {
            a = postTrans[_l];
            t[a.fn](a.a1, a.a2);
          }
          ex = s.exit().remove();
          if (!e.empty() || !ex.empty() || force) {
            out.set(s).notify();
          }
        } else {
          s = _parent.selectAll(self).remove();
          out.set(s).notify();
        }
      }
    });
    return out;
  };
})();
dvl.chain = function(f, h) {
  var out;
  f = dvl.wrapConstIfNeeded(f);
  h = dvl.wrapConstIfNeeded(h);
  out = dvl.def(null, 'chain');
  dvl.register({
    listen: [f, h],
    change: [out],
    fn: function() {
      var _f, _h;
      _f = f.get();
      _h = h.get();
      if (_f && _h) {
        out.set(function(x) {
          return _h(_f(x));
        });
      } else {
        out.set(null);
      }
      dvl.notify(out);
    }
  });
  return out;
};
dvl_get = function(v) {
  return v.get();
};
dvl.op = dvl_op = function(fn) {
  var liftedFn;
  liftedFn = lift(fn);
  return function() {
    var args, out;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    args = args.map(dvl.wrapConstIfNeeded);
    out = dvl.def(null, 'out');
    dvl.register({
      listen: args,
      change: [out],
      fn: function() {
        out.set(liftedFn.apply(null, args.map(dvl_get)));
        dvl.notify(out);
      }
    });
    return out;
  };
};
op_to_lift = {
  'or': function() {
    var arg, _i, _len;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      arg = arguments[_i];
      if (arg) {
        return arg;
      }
    }
    return false;
  },
  'add': function() {
    var arg, sum, _i, _len;
    sum = 0;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      arg = arguments[_i];
      if (arg != null) {
        sum += arg;
      } else {
        return null;
      }
    }
    return sum;
  },
  'sub': function() {
    var arg, mult, sum, _i, _len;
    sum = 0;
    mult = 1;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      arg = arguments[_i];
      if (arg != null) {
        sum += arg * mult;
        mult = -1;
      } else {
        return null;
      }
    }
    return sum;
  },
  'list': function() {
    var arg, args, _i, _len;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (arg == null) {
        return null;
      }
    }
    return args;
  },
  'concat': function() {
    var arg, args, _i, _len;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (arg == null) {
        return null;
      }
    }
    return args.join('');
  },
  'iff': function(cond, truthy, falsy) {
    if (cond) {
      return truthy;
    } else {
      return falsy;
    }
  },
  'iffEq': function(lhs, rhs, truthy, falsy) {
    if (lhs === rhs) {
      return truthy;
    } else {
      return falsy;
    }
  },
  'iffLt': function(lhs, rhs, truthy, falsy) {
    if (lhs < rhs) {
      return truthy;
    } else {
      return falsy;
    }
  },
  'makeTranslate': function(x, y) {
    if ((x != null) && (y != null)) {
      return "translate(" + x + "," + y + ")";
    } else {
      return null;
    }
  }
};
for (k in op_to_lift) {
  fn = op_to_lift[k];
  dvl_op[k] = dvl_op(fn);
}
clipId = 0;
dvl.svg || (dvl.svg = {});
dvl.svg.clipPath = function(_arg) {
  var cp, height, myId, parent, width, x, y;
  parent = _arg.parent, x = _arg.x, y = _arg.y, width = _arg.width, height = _arg.height;
  x = dvl.wrapConstIfNeeded(x || 0);
  y = dvl.wrapConstIfNeeded(y || 0);
  clipId++;
  myId = "cp" + clipId;
  cp = dvl.valueOf(parent).append('defs').append('clipPath').attr('id', myId);
  dvl.bind({
    parent: cp,
    self: 'rect',
    attr: {
      x: x,
      y: y,
      width: width,
      height: height
    }
  });
  return "url(#" + myId + ")";
};
dvl.misc = {};
dvl.misc.mouse = function(element, out) {
  var height, recorder, width;
  element = dvl.wrapConstIfNeeded(element);
  width = dvl.wrapConstIfNeeded(width);
  height = dvl.wrapConstIfNeeded(height);
  out = dvl.wrapVarIfNeeded(out, 'mouse');
  recorder = function() {
    var mouse, _element;
    _element = element.get();
    mouse = _element && d3.event ? d3.svg.mouse(_element.node()) : null;
    out.set(mouse).notify();
  };
  element.get().on('mousemove', recorder).on('mouseout', recorder);
  dvl.register({
    name: 'mouse_recorder',
    listen: [parent],
    change: [out],
    fn: recorder
  });
  return out;
};
dvl.misc.delay = function(data, time) {
  var out, timeoutFn, timer;
  if (time == null) {
    time = 1;
  }
  data = dvl.wrapConstIfNeeded(data);
  time = dvl.wrapConstIfNeeded(time);
  timer = null;
  out = dvl.def();
  timeoutFn = function() {
    out.set(data.get()).notify();
    return timer = null;
  };
  dvl.register({
    listen: [data, time],
    name: name || 'timeout',
    fn: function() {
      var t;
      if (timer) {
        clearTimeout(timer);
      }
      timer = null;
      if (time.get() != null) {
        t = Math.max(0, time.get());
        return timer = setTimeout(timeoutFn, t);
      }
    }
  });
  return out;
};
dvl.html = {};
dvl.html.resizer = function(_arg) {
  var dimension, fn, onResize, out, selector;
  selector = _arg.selector, out = _arg.out, dimension = _arg.dimension, fn = _arg.fn;
  out = dvl.wrapVarIfNeeded(out);
  dimension = dvl.wrapConstIfNeeded(dimension || 'width');
  fn = dvl.wrapConstIfNeeded(fn || dvl.identity);
  onResize = function() {
    var e, val, _dimension, _fn;
    _dimension = dimension.get();
    _fn = fn.get();
    if ((_dimension === 'width' || _dimension === 'height') && _fn) {
      if (selector) {
        e = jQuery(selector);
        val = e[_dimension]();
      } else {
        val = document.body[_dimension === 'width' ? 'clientWidth' : 'clientHeight'];
      }
      return out.update(_fn(val));
    } else {
      return out.update(null);
    }
  };
  $(window).resize(onResize);
  dvl.register({
    name: 'resizer',
    listen: [dimension, fn],
    change: [out],
    fn: onResize
  });
  return out;
};
dvl.html.out = function(_arg) {
  var attr, data, fn, format, hideInvalid, invalid, out, selector, style, text, updateHtml, what;
  selector = _arg.selector, data = _arg.data, fn = _arg.fn, format = _arg.format, invalid = _arg.invalid, hideInvalid = _arg.hideInvalid, attr = _arg.attr, style = _arg.style, text = _arg.text;
  if (!data) {
    throw 'must have data';
  }
  data = dvl.wrapConstIfNeeded(data);
  format = format != null ? format : fn;
  if (!selector) {
    throw 'must have selector';
  }
  selector = dvl.wrapConstIfNeeded(selector);
  format = dvl.wrapConstIfNeeded(format || dvl.identity);
  invalid = dvl.wrapConstIfNeeded(invalid || null);
  hideInvalid = dvl.wrapConstIfNeeded(hideInvalid || false);
  if (attr) {
    what = dvl.wrapConstIfNeeded(attr);
    out = function(selector, string) {
      return d3.select(selector).attr(what.get(), string);
    };
  } else if (style) {
    what = dvl.wrapConstIfNeeded(style);
    out = function(selector, string) {
      return d3.select(selector).style(what.get(), string);
    };
  } else if (text) {
    out = function(selector, string) {
      return d3.select(selector).text(string);
    };
  } else {
    out = function(selector, string) {
      return d3.select(selector).html(string);
    };
  }
  updateHtml = function() {
    var a, d, inv, s, sel;
    s = selector.get();
    a = format.get();
    d = data.get();
    if (s != null) {
      if ((a != null) && (d != null)) {
        sel = out(s, a(d));
        if (hideInvalid.get()) {
          sel.style('display', null);
        }
      } else {
        inv = invalid.get();
        out(s, inv);
        if (hideInvalid.get()) {
          d3.select(s).style('display', 'none');
        }
      }
    }
  };
  dvl.register({
    fn: updateHtml,
    listen: [data, selector, format],
    name: 'html_out'
  });
};
dvl.html.list = function(_arg) {
  var classStr, data, extras, i, icons, label, link, listClass, onClick, onEnter, onLeave, onSelect, selection, selections, selector, sortFn, ul, _i, _len;
  selector = _arg.selector, data = _arg.data, label = _arg.label, link = _arg.link, listClass = _arg["class"], selection = _arg.selection, selections = _arg.selections, onSelect = _arg.onSelect, onEnter = _arg.onEnter, onLeave = _arg.onLeave, icons = _arg.icons, extras = _arg.extras, classStr = _arg.classStr, sortFn = _arg.sortFn;
  if (!selector) {
    throw 'must have selector';
  }
  if (!data) {
    throw 'must have data';
  }
  selection = dvl.wrapVarIfNeeded(selection, 'selection');
  selections = dvl.wrapVarIfNeeded(selections || [], 'selections');
  sortFn = dvl.wrapConstIfNeeded(sortFn);
  data = dvl.wrapConstIfNeeded(data);
  label = dvl.wrapConstIfNeeded(label || dvl.identity);
  link = dvl.wrapConstIfNeeded(link);
  icons || (icons = []);
  for (_i = 0, _len = icons.length; _i < _len; _i++) {
    i = icons[_i];
    i.position || (i.position = 'right');
  }
  if (listClass != null) {
    listClass = dvl.wrapConstIfNeeded(listClass);
  } else {
    listClass = dvl.apply([selection, selections], function(_selection, _selections) {
      if (_selection) {
        if (_selections) {
          return function(value) {
            return (value === _selection ? 'is_selection' : 'isnt_selection') + ' ' + (__indexOf.call(_selections, value) >= 0 ? 'is_selections' : 'isnt_selections');
          };
        } else {
          return function(value) {
            if (value === _selection) {
              return 'is_selection';
            } else {
              return 'isnt_selection';
            }
          };
        }
      } else {
        if (_selections) {
          return function(value) {
            if (__indexOf.call(_selections, value) >= 0) {
              return 'is_selections';
            } else {
              return 'isnt_selections';
            }
          };
        } else {
          return null;
        }
      }
    });
  }
  ul = d3.select(selector).append('ul').attr('class', classStr);
  onClick = function(val, i) {
    var linkVal, sl, _base, _sortFn;
    if ((typeof onSelect === "function" ? onSelect(val, i) : void 0) === false) {
      return;
    }
    linkVal = typeof (_base = link.get()) === "function" ? _base(val) : void 0;
    selection.set(val);
    sl = (selections.get() || []).slice();
    i = sl.indexOf(val);
    if (i === -1) {
      sl.push(val);
      _sortFn = sortFn.get();
      if (typeof _sortFn === 'function') {
        sl.sort(_sortFn);
      } else {
        sl.sort();
      }
    } else {
      sl.splice(i, 1);
    }
    selections.set(sl);
    dvl.notify(selection, selections);
    if (linkVal) {
      window.location.href = linkVal;
    }
  };
  dvl.register({
    name: 'update_html_list',
    listen: [data, label, link],
    fn: function() {
      var a, addIcons, cont, sel, _class, _data, _label, _link;
      _data = data.get();
      _label = label.get();
      _link = link.get();
      _class = listClass.get();
      if (!_data) {
        return;
      }
      addIcons = function(el, position) {
        icons.forEach(function(icon) {
          if (icon.position !== position) {
            return;
          }
          classStr = 'icon_cont ' + position;
          if (icon.classStr) {
            classStr += ' ' + icon.classStr;
          }
          el.append('div').attr('class', classStr).attr('title', icon.title).on('click', function(val, i) {
            if ((typeof icon.onSelect === "function" ? icon.onSelect(val, i) : void 0) === false) {
              d3.event.stopPropagation();
            }
          }).on('mouseover', function(val, i) {
            if ((typeof icon.onEnter === "function" ? icon.onEnter(val, i) : void 0) === false) {
              d3.event.stopPropagation();
            }
          }).on('mouseout', function(val, i) {
            if ((typeof icon.onLeave === "function" ? icon.onLeave(val, i) : void 0) === false) {
              d3.event.stopPropagation();
            }
          }).append('div').attr('class', 'icon');
        });
      };
      sel = ul.selectAll('li').data(_data);
      a = sel.enter().append('li').append('a');
      addIcons(a, 'left');
      a.append('span');
      addIcons(a, 'right');
      cont = sel.attr('class', _class).on('click', onClick).on('mouseover', onEnter).on('mouseout', onLeave).select('a').attr('href', _link);
      cont.select('span').text(_label);
      sel.exit().remove();
    }
  });
  dvl.register({
    name: 'update_class_list',
    listen: [listClass],
    fn: function() {
      var _class;
      _class = listClass.get();
      return ul.selectAll('li').attr('class', _class);
    }
  });
  return {
    selection: selection,
    selections: selections,
    node: ul.node()
  };
};
dvl.html.dropdownList = function(_arg) {
  var classStr, close, data, divCont, getClass, icons, keepOnClick, label, link, listClass, menuAnchor, menuCont, menuOffset, menuOpen, myOnSelect, onEnter, onLeave, onSelect, open, selectedDiv, selection, selectionLabel, selections, selector, sortFn, title, updateSelection, valueSpan;
  selector = _arg.selector, data = _arg.data, label = _arg.label, selectionLabel = _arg.selectionLabel, link = _arg.link, listClass = _arg["class"], selection = _arg.selection, selections = _arg.selections, onSelect = _arg.onSelect, onEnter = _arg.onEnter, onLeave = _arg.onLeave, classStr = _arg.classStr, menuAnchor = _arg.menuAnchor, menuOffset = _arg.menuOffset, title = _arg.title, icons = _arg.icons, sortFn = _arg.sortFn, keepOnClick = _arg.keepOnClick;
  if (!selector) {
    throw 'must have selector';
  }
  if (!data) {
    throw 'must have data';
  }
  selection = dvl.wrapVarIfNeeded(selection, 'selection');
  selections = dvl.wrapVarIfNeeded(selections, 'selections');
  menuAnchor = dvl.wrapConstIfNeeded(menuAnchor || 'left');
  menuOffset = dvl.wrapConstIfNeeded(menuOffset || {
    x: 0,
    y: 0
  });
  data = dvl.wrapConstIfNeeded(data);
  label = dvl.wrapConstIfNeeded(label || dvl.identity);
  selectionLabel = dvl.wrapConstIfNeeded(selectionLabel || label);
  link = dvl.wrapConstIfNeeded(link);
  if (title) {
    title = dvl.wrapConstIfNeeded(title);
  }
  icons || (icons = []);
  menuOpen = false;
  getClass = function() {
    return (classStr != null ? classStr : '') + ' ' + (menuOpen ? 'open' : 'closed');
  };
  divCont = d3.select(selector).append('div').attr('class', getClass()).style('position', 'relative');
  selectedDiv = divCont.append('div').attr('class', 'selected');
  valueSpan = selectedDiv.append('span');
  open = function() {
    var anchor, height, offset, pos, sp;
    sp = $(selectedDiv.node());
    pos = sp.position();
    height = sp.outerHeight(true);
    anchor = menuAnchor.get();
    offset = menuOffset.get();
    menuCont.style('display', null).style('top', (pos.top + height + offset.y) + 'px');
    if (anchor === 'left') {
      menuCont.style('left', (pos.left + offset.x) + 'px');
    } else {
      menuCont.style('right', (pos.left - offset.x) + 'px');
    }
    menuOpen = true;
    divCont.attr('class', getClass());
  };
  close = function() {
    menuCont.style('display', 'none');
    menuOpen = false;
    divCont.attr('class', getClass());
  };
  myOnSelect = function(text, i) {
    if (!keepOnClick) {
      close();
    }
    return typeof onSelect === "function" ? onSelect(text, i) : void 0;
  };
  icons.forEach(function(icon) {
    var icon_onSelect;
    icon_onSelect = icon.onSelect;
    icon.onSelect = function(val, i) {
      if (!keepOnClick) {
        close();
      }
      return typeof icon_onSelect === "function" ? icon_onSelect(val, i) : void 0;
    };
  });
  menuCont = divCont.append('div').attr('class', 'menu_cont').style('position', 'absolute').style('z-index', 1000).style('display', 'none');
  dvl.html.list({
    selector: menuCont.node(),
    data: data,
    label: label,
    link: link,
    "class": listClass,
    sortFn: sortFn,
    selection: selection,
    selections: selections,
    onSelect: myOnSelect,
    onEnter: onEnter,
    onLeave: onLeave,
    classStr: 'list',
    icons: icons
  });
  $(window).bind('click', function(e) {
    if ($(menuCont.node()).find(e.target).length) {
      return;
    }
    if (selectedDiv.node() === e.target || $(selectedDiv.node()).find(e.target).length) {
      if (menuOpen) {
        close();
      } else {
        open();
      }
    } else {
      close();
    }
    return {
      node: divCont.node(),
      selection: selection,
      selections: selections
    };
  }).bind('blur', close);
  updateSelection = function() {
    var sel, selLabel;
    if (title) {
      valueSpan.text(title.get());
    } else {
      sel = selection.get();
      selLabel = selectionLabel.get();
      valueSpan.text(selLabel(sel));
    }
  };
  dvl.register({
    fn: updateSelection,
    listen: [selection, selectionLabel, title],
    name: 'selection_updater'
  });
  return {
    node: divCont.node(),
    menuCont: menuCont.node(),
    selection: selection
  };
};
dvl.html.select = function(_arg) {
  var classStr, data, label, onChange, selChange, selectEl, selection, selector;
  selector = _arg.selector, data = _arg.data, label = _arg.label, selection = _arg.selection, onChange = _arg.onChange, classStr = _arg.classStr;
  if (!selector) {
    throw 'must have selector';
  }
  if (!data) {
    throw 'must have data';
  }
  selection = dvl.wrapVarIfNeeded(selection, 'selection');
  data = dvl.wrapConstIfNeeded(data);
  label = dvl.wrapConstIfNeeded(label || dvl.identity);
  selChange = function(val) {
    if ((typeof onChange === "function" ? onChange(val) : void 0) === false) {
      return;
    }
    return selection.update(val);
  };
  selectEl = d3.select(selector).append('select').attr('class', classStr || null).on('change', selChange);
  dvl.bind({
    parent: selectEl,
    self: 'option',
    data: data,
    attr: {
      value: function(d, i) {
        return i;
      }
    },
    text: label
  });
  dvl.register({
    listen: [data, selection],
    fn: function() {
      var idx, _data, _selection;
      _data = data.get();
      _selection = selection.get();
      if (!(_data && _selection)) {
        return;
      }
      idx = _data.indexOf(_selection);
      if (selectEl.node().value !== idx) {
        selectEl.node().value = idx;
      }
    }
  });
  selChange();
  return selection;
};
dvl.compare = function(acc, reverse) {
  acc = dvl.wrapConstIfNeeded(acc || dvl.ident);
  reverse = dvl.wrapConstIfNeeded(reverse || false);
  return dvl.apply({
    args: [acc, reverse],
    fn: function(acc, reverse) {
      if (reverse) {
        return function(a, b) {
          var t, va, vb;
          va = acc(a);
          vb = acc(b);
          t = typeof va;
          if (t === 'string') {
            return vb.localeCompare(va);
          } else if (t === 'number') {
            return vb - va;
          } else {
            throw "bad sorting type " + t;
          }
        };
      } else {
        return function(a, b) {
          var t, va, vb;
          va = acc(a);
          vb = acc(b);
          t = typeof va;
          if (t === 'string') {
            return va.localeCompare(vb);
          } else if (t === 'number') {
            return va - vb;
          } else {
            throw "bad sorting type " + t;
          }
        };
      }
    }
  });
};
(function() {
  var default_compare_modes;
  default_compare_modes = ['up', 'down'];
  dvl.html.table = function(_arg) {
    var bodyCol, c, classStr, columns, comp, compare, compareList, compareMap, data, headerCol, parent, rowClass, rowLimit, sort, sortDir, sortOn, sortOnIndicator, table, _i, _len, _ref2, _ref3, _ref4;
    parent = _arg.parent, data = _arg.data, sort = _arg.sort, classStr = _arg.classStr, rowClass = _arg.rowClass, rowLimit = _arg.rowLimit, columns = _arg.columns;
    table = dvl.valueOf(parent).append('table').attr('class', classStr);
    sort = sort || {};
    sortOn = dvl.wrapVarIfNeeded(sort.on);
    sortDir = dvl.wrapVarIfNeeded(sort.dir);
    sortOnIndicator = dvl.wrapVarIfNeeded((_ref2 = sort.onIndicator) != null ? _ref2 : sortOn);
    headerCol = [];
    bodyCol = [];
    compareMap = {};
    compareList = [sortOn, sortDir];
    for (_i = 0, _len = columns.length; _i < _len; _i++) {
      c = columns[_i];
            if ((_ref3 = c.sortable) != null) {
        _ref3;
      } else {
        c.sortable = true;
      };
      if (c.sortable) {
        if (c.compare != null) {
          comp = dvl.wrapConstIfNeeded(c.compare);
        } else {
          comp = dvl.compare(c.value);
        }
        compareMap[c.id] = comp;
        compareList.push(comp);
        if (!((_ref4 = c.compareModes) != null ? _ref4[0] : void 0)) {
          c.compareModes = default_compare_modes;
        }
      }
      headerCol.push({
        id: c.id,
        title: c.title,
        "class": c["class"],
        visible: c.visible,
        tooltip: c.headerTooltip
      });
      bodyCol.push({
        id: c.id,
        "class": c["class"],
        visible: c.visible,
        value: c.value,
        hover: c.hover,
        render: c.render,
        on: c.on
      });
    }
    compare = dvl.def(null);
    dvl.register({
      listen: compareList,
      change: [compare],
      fn: function() {
        var cmp, oldCmp, _ref5, _sortDir, _sortOn;
        _sortOn = sortOn.get();
        _sortDir = sortDir.get();
        if (_sortOn != null) {
          cmp = (_ref5 = compareMap[_sortOn]) != null ? _ref5.get() : void 0;
          if (cmp && _sortDir === 'down') {
            oldCmp = cmp;
            cmp = function(a, b) {
              return oldCmp(b, a);
            };
          }
          compare.set(cmp);
        } else {
          compare.set(null);
        }
        compare.notify();
      }
    });
    dvl.html.table.header({
      parent: table,
      columns: headerCol,
      onClick: function(id) {
        var c, column, compareModes, _j, _len2;
        column = null;
        for (_j = 0, _len2 = columns.length; _j < _len2; _j++) {
          c = columns[_j];
          if (c.id === id) {
            column = c;
            break;
          }
        }
        if (!(column && column.sortable)) {
          return;
        }
        compareModes = column.compareModes;
        if (id === sortOn.get()) {
          sortDir.set(compareModes[(compareModes.indexOf(sortDir.get()) + 1) % compareModes.length]);
          dvl.notify(sortDir);
        } else {
          sortOn.set(id);
          sortDir.set(compareModes[0]);
          dvl.notify(sortOn, sortDir);
        }
      }
    });
    dvl.html.table.body({
      parent: table,
      data: data,
      rowClass: rowClass,
      rowLimit: rowLimit,
      columns: bodyCol,
      compare: compare
    });
    return {};
  };
  dvl.html.table.header = function(_arg) {
    var c, columns, enterTh, listen, nc, newColumns, onClick, parent, sel, thead, _i, _len, _ref2;
    parent = _arg.parent, columns = _arg.columns, onClick = _arg.onClick;
    if (!parent) {
      throw 'there needs to be a parent';
    }
    onClick = dvl.wrapConstIfNeeded(onClick);
    thead = dvl.valueOf(parent).append('thead').append('tr');
    listen = [onClick];
    newColumns = [];
    for (_i = 0, _len = columns.length; _i < _len; _i++) {
      c = columns[_i];
      newColumns.push(nc = {
        id: c.id,
        title: dvl.wrapConstIfNeeded(c.title),
        "class": dvl.wrapConstIfNeeded(c["class"]),
        visible: dvl.wrapConstIfNeeded((_ref2 = c.visible) != null ? _ref2 : true),
        tooltip: dvl.wrapConstIfNeeded(c.tooltip),
        indicator: c.indicator ? dvl.wrapConstIfNeeded(c.indicator) : void 0
      });
      listen.push(nc.title, nc["class"], nc.visible, nc.tooltip, nc.indicator);
    }
    columns = newColumns;
    sel = thead.selectAll('th').data(columns);
    enterTh = sel.enter().append('th');
    enterTh.append('span');
    enterTh.append('div').attr('class', 'indicator').style('display', 'none');
    sel.exit().remove();
    dvl.register({
      name: 'header_render',
      listen: listen,
      fn: function() {
        var c, i, ind, visibleChanged, _indicator, _len2;
        for (i = 0, _len2 = columns.length; i < _len2; i++) {
          c = columns[i];
          sel = thead.select("th:nth-child(" + (i + 1) + ")");
          visibleChanged = c.visible.hasChanged();
          if (c.visible.get()) {
            if (c["class"].hasChanged() || visibleChanged) {
              sel.attr('class', c["class"].get());
            }
            if (c.tooltip.hasChanged() || visibleChanged) {
              sel.attr('title', c.tooltip.get());
            }
            if (c.tooltip.hasChanged() || visibleChanged) {
              sel.attr('title', c.tooltip.get());
            }
            if (visibleChanged) {
              sel.style('display', null);
            }
            if (onClick.hasChanged() || visibleChanged) {
              sel.on('click', function(d) {
                var _base;
                return typeof (_base = onClick.get()) === "function" ? _base(d.id) : void 0;
              });
            }
            if (c.title.hasChanged() || visibleChanged) {
              sel.select('span').text(c.title.get());
            }
            if (c.indicator && (c.indicator.hasChanged() || visibleChanged)) {
              _indicator = c.indicator.get();
              ind = sel.select('div.indicator');
              if (_indicator) {
                ind.style('display', null).attr('class', 'indicator ' + _indicator);
              } else {
                ind.style('display', 'none');
              }
            }
          } else {
            if (visibleChanged) {
              sel.style('display', 'none');
            }
          }
        }
      }
    });
  };
  dvl.html.table.body = function(_arg) {
    var c, change, columns, compare, data, k, listen, nc, newColumns, parent, render, rowClass, rowLimit, tbody, v, _i, _j, _len, _len2, _ref2, _ref3;
    parent = _arg.parent, data = _arg.data, compare = _arg.compare, rowClass = _arg.rowClass, rowLimit = _arg.rowLimit, columns = _arg.columns;
    if (!parent) {
      throw 'there needs to be a parent';
    }
    if (!data) {
      throw 'there needs to be data';
    }
    tbody = dvl.valueOf(parent).append('tbody');
    compare = dvl.wrapConstIfNeeded(compare);
    if (rowClass != null) {
      rowClass = dvl.wrapConstIfNeeded(rowClass);
    }
    rowLimit = dvl.wrapConstIfNeeded(rowLimit);
    listen = [data, compare, rowClass, rowLimit];
    change = [];
    newColumns = [];
    for (_i = 0, _len = columns.length; _i < _len; _i++) {
      c = columns[_i];
      newColumns.push(nc = {
        id: c.id,
        "class": dvl.wrapConstIfNeeded(c["class"]),
        visible: dvl.wrapConstIfNeeded((_ref2 = c.visible) != null ? _ref2 : true),
        hover: dvl.wrapConstIfNeeded(c.hover),
        value: dvl.wrapConstIfNeeded(c.value)
      });
      listen.push(nc["class"], nc.visible, nc.hover);
      nc.render = c.render || 'text';
      nc.on = {};
      _ref3 = c.on;
      for (k in _ref3) {
        v = _ref3[k];
        v = dvl.wrapConstIfNeeded(v);
        listen.push(v);
        nc.on[k] = v;
      }
      change.push(nc.selection = dvl.def(null).name("" + c.id + "_selection"));
    }
    columns = newColumns;
    dvl.register({
      name: 'body_render',
      listen: listen,
      change: change,
      fn: function() {
        var c, colSel, dataSorted, i, k, newRows, rowSel, sel, v, visibleChanged, _compare, _len2, _ref4, _rowClass, _rowLimit;
        dataSorted = data.get() || [];
        _compare = compare.get();
        if (_compare) {
          dataSorted = dataSorted.slice().sort(_compare);
        }
        _rowLimit = rowLimit.get();
        if (_rowLimit != null) {
          dataSorted = dataSorted.slice(0, _rowLimit);
        }
        rowSel = tbody.selectAll('tr').data(dataSorted);
        newRows = !rowSel.enter().append('tr').empty();
        rowSel.exit().remove();
        if (rowClass) {
          _rowClass = rowClass.get();
          rowSel.attr('class', _rowClass);
        }
        colSel = rowSel.selectAll('td').data(columns);
        colSel.enter().append('td');
        colSel.exit().remove();
        for (i = 0, _len2 = columns.length; i < _len2; i++) {
          c = columns[i];
          sel = tbody.selectAll("td:nth-child(" + (i + 1) + ")").data(dataSorted);
          visibleChanged = c.visible.hasChanged() || newRows;
          if (c.visible.get()) {
            if (c["class"].hasChanged() || visibleChanged) {
              sel.attr('class', c["class"].get());
            }
            if (c.hover.hasChanged() || visibleChanged) {
              sel.attr('title', c.hover.get());
            }
            if (visibleChanged) {
              sel.style('display', null);
            }
            _ref4 = c.on;
            for (k in _ref4) {
              v = _ref4[k];
              if (v.hasChanged() || visibleChanged) {
                sel.on(k, v.get());
              }
            }
            c.selection.set(sel).notify();
          } else {
            if (visibleChanged) {
              sel.style('display', 'none');
            }
          }
        }
      }
    });
    for (_j = 0, _len2 = columns.length; _j < _len2; _j++) {
      c = columns[_j];
      render = typeof c.render === 'function' ? c.render : dvl.html.table.render[c.render];
      render.call(c, c.selection, c.value);
    }
  };
  return dvl.html.table.render = {
    text: function(selection, value) {
      dvl.register({
        listen: [selection, value],
        fn: function() {
          var _selection, _value;
          _selection = selection.get();
          _value = value.get();
          if ((_selection != null) && _value) {
            _selection.text(_value);
          }
        }
      });
    },
    html: function(selection, value) {
      dvl.register({
        listen: [selection, value],
        fn: function() {
          var _selection, _value;
          _selection = selection.get();
          _value = value.get();
          if ((_selection != null) && _value) {
            _selection.html(_value);
          }
        }
      });
    },
    aLink: function(_arg) {
      var href;
      href = _arg.href;
      return function(selection, value) {
        dvl.bind({
          parent: selection,
          self: 'a.link',
          attr: {
            href: href
          },
          text: value
        });
      };
    },
    spanLink: function(_arg) {
      var click, titleGen;
      click = _arg.click;
      titleGen = dvl.wrapConstIfNeeded(titleGen);
      return function(sel, value) {
        sel = sel.selectAll('span').data(function(d) {
          return [d];
        });
        sel.enter().append('span').attr('class', 'span_link');
        sel.html(value).on('click', click);
      };
    },
    img: function(selection, value) {
      dvl.bind({
        parent: selection,
        self: 'img',
        attr: {
          src: value
        }
      });
    },
    imgDiv: function(selection, value) {
      dvl.bind({
        parent: selection,
        self: 'div',
        attr: {
          "class": value
        }
      });
    },
    sparkline: function(_arg) {
      var height, padding, width, x, y;
      width = _arg.width, height = _arg.height, x = _arg.x, y = _arg.y, padding = _arg.padding;
            if (padding != null) {
        padding;
      } else {
        padding = 0;
      };
      return function(selection, value) {
        var dataFn, lineFn, svg;
        lineFn = dvl.apply({
          args: [x, y, padding],
          fn: function(x, y, padding) {
            return function(d) {
              var mmx, mmy, sx, sy;
              mmx = dvl.util.getMinMax(d, (function(d) {
                return d[x];
              }));
              mmy = dvl.util.getMinMax(d, (function(d) {
                return d[y];
              }));
              sx = d3.scale.linear().domain([mmx.min, mmx.max]).range([padding, width - padding]);
              sy = d3.scale.linear().domain([mmy.min, mmy.max]).range([height - padding, padding]);
              return d3.svg.line().x(function(dp) {
                return sx(dp[x]);
              }).y(function(dp) {
                return sy(dp[y]);
              })(d);
            };
          }
        });
        dataFn = dvl.apply({
          args: value,
          fn: function(value) {
            return function(d, i) {
              return [value(d, i)];
            };
          }
        });
        svg = dvl.bind({
          parent: selection,
          self: 'svg.sparkline',
          data: dataFn,
          attr: {
            width: width,
            height: height
          }
        });
        dvl.bind({
          parent: svg,
          self: 'path',
          data: function(d) {
            return [d];
          },
          attr: {
            d: lineFn
          }
        });
      };
    }
  };
})();
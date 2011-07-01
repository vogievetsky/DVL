var debug, generator_maker_maker;
var __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};
if (!d3) {
  throw 'd3 is needed for now.';
}
if (!pv) {
  throw 'protovis is needed for now.';
}
if (!jQuery) {
  throw 'jQuery is needed for now.';
}
if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun, thisp) {
    var len = this.length;
    if (typeof fun != 'function')
      throw new TypeError();

    var res = new Array();
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
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
  if (arguments.length <= 1) {
    console.log(arguments[0]);
  } else if (arguments.length === 2) {
    console.log(arguments[0], arguments[1]);
  } else {
    console.log(Array.prototype.slice.apply(arguments));
  }
  return arguments[0];
};
window.dvl = {
  version: '0.77'
};
dvl.util = {
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
  getRow: function(data, i) {
    var k, row, vs;
    if (dvl.typeOf(data) === 'array') {
      return data[i];
    } else {
      row = {};
      for (k in data) {
        vs = data[k];
        row[k] = vs[i];
      }
      return row;
    }
  }
};
(function() {
  var DVLConst, DVLDef, DVLFunctionObject, array_ctor, bfsUpdate, bfsZero, changedInNotify, collect_notify, constants, curCollectListener, curNotifyListener, date_ctor, end_notify_collect, init_notify, lastNotifyRun, levelPriorityQueue, nextObjId, regex_ctor, registerers, start_notify_collect, toNotify, uniqById, variables, within_notify;
  array_ctor = (new Array).constructor;
  date_ctor = (new Date).constructor;
  regex_ctor = (new RegExp).constructor;
  dvl.typeOf = function(v) {
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
  dvl.intersectSize = function(as, bs) {
    var a, count, _i, _len;
    count = 0;
    for (_i = 0, _len = as.length; _i < _len; _i++) {
      a = as[_i];
      if (__indexOf.call(bs, a) >= 0) {
        count += 1;
      }
    }
    return count;
  };
  nextObjId = 1;
  constants = {};
  variables = {};
  DVLConst = (function() {
    function DVLConst(value, name) {
      this.value = value;
      this.name = name;
      this.name || (this.name = 'obj');
      this.id = this.name + '_const' + nextObjId;
      this.changed = false;
      constants[this.id] = this;
      nextObjId += 1;
      return this;
    }
    DVLConst.prototype.toString = function() {
      return "|" + this.id + ":" + this.value + "|";
    };
    DVLConst.prototype.set = function() {
      return this;
    };
    DVLConst.prototype.setLazy = function() {
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
    DVLConst.prototype.push = function(value) {
      return null;
    };
    DVLConst.prototype.shift = function() {
      return;
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
  dvl["const"] = function(value, name) {
    return new DVLConst(value, name);
  };
  DVLDef = (function() {
    function DVLDef(value, name) {
      this.value = value;
      this.name = name;
      this.name || (this.name = 'obj');
      this.id = this.name + '_' + nextObjId;
      this.prev = null;
      this.changed = false;
      this.vgen = void 0;
      this.vgenPrev = void 0;
      this.vlen = -1;
      this.lazy = null;
      this.listeners = [];
      this.changers = [];
      variables[this.id] = this;
      nextObjId++;
      return this;
    }
    DVLDef.prototype.resolveLazy = function() {
      var val;
      if (this.lazy) {
        val = this.lazy();
        if (this.value === val && dvl.typeOf(val) === "object") {
          throw "lazy return must be new object in " + this.id;
        }
        this.prev = val;
        this.value = val;
      }
      return null;
    };
    DVLDef.prototype.toString = function() {
      return "|" + this.id + ":" + this.value + "|";
    };
    DVLDef.prototype.hasChanged = function() {
      return this.changed;
    };
    DVLDef.prototype.resetChanged = function() {
      this.changed = false;
      return this;
    };
    DVLDef.prototype.set = function(val) {
      if ((val != null) && this.value === val && dvl.typeOf(val) === "object") {
        throw "must be new object in " + this.id;
      }
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
    DVLDef.prototype.push = function(val) {
      this.value.push(val);
      this.changed = true;
      return null;
    };
    DVLDef.prototype.shift = function() {
      var val;
      val = this.value.shift();
      this.changed = true;
      return val;
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
      delete variables[id];
      return null;
    };
    return DVLDef;
  })();
  dvl.def = function(value, name) {
    return new DVLDef(value, name);
  };
  dvl.knows = function(v) {
    return v && v.id && (variables[v.id] || constants[v.id]);
  };
  dvl.wrapConstIfNeeded = function(v, name) {
    if (v === void 0) {
      v = null;
    }
    if (dvl.knows(v)) {
      return v;
    } else {
      return dvl["const"](v, name);
    }
  };
  dvl.wrapVarIfNeeded = function(v, name) {
    if (v === void 0) {
      v = null;
    }
    if (dvl.knows(v)) {
      return v;
    } else {
      return dvl.def(v, name);
    }
  };
  registerers = {};
  uniqById = function(vs) {
    var res, seen, v, _i, _len;
    res = [];
    if (vs) {
      seen = {};
      for (_i = 0, _len = vs.length; _i < _len; _i++) {
        v = vs[_i];
        if ((v != null) && v.listeners && v.changers && !seen[v.id]) {
          seen[v.id] = true;
          res.push(v);
        }
      }
    }
    return res;
  };
  bfsUpdate = function(queue) {
    var initIds, skip, v, w, _i, _j, _len, _len2, _ref;
    initIds = {};
    for (_i = 0, _len = queue.length; _i < _len; _i++) {
      v = queue[_i];
      initIds[v.id] = 1;
    }
    skip = queue.length;
    while (queue.length > 0) {
      v = queue.shift();
      if (skip > 0) {
        --skip;
      } else {
        if (initIds[v.id]) {
          throw "circular dependancy detected";
        }
      }
      _ref = v.updates;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        w = _ref[_j];
        w.level = Math.max(w.level, v.level + 1);
        queue.push(w);
      }
    }
    return null;
  };
  bfsZero = function(queue) {
    var v, w, _i, _len, _ref;
    while (queue.length > 0) {
      v = queue.shift();
      _ref = v.updates;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        w = _ref[_i];
        w.level = 0;
        queue.push(w);
      }
    }
    return null;
  };
  DVLFunctionObject = (function() {
    function DVLFunctionObject(id, ctx, fn, listen, change) {
      this.id = id;
      this.ctx = ctx;
      this.fn = fn;
      this.listen = listen;
      this.change = change;
      this.updates = [];
      this.level = 0;
      return this;
    }
    DVLFunctionObject.prototype.addChange = function(v) {
      var lis, _i, _len, _ref;
      if (!(v.listeners && v.changers)) {
        return this;
      }
      this.change.push(v);
      v.changers.push(this);
      _ref = v.listeners;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        lis = _ref[_i];
        this.updates.push(lis);
      }
      bfsUpdate([this]);
      return this;
    };
    DVLFunctionObject.prototype.addListen = function(v) {
      var changedSave, chng, _i, _len, _ref;
      if (v.listeners && v.changers) {
        this.listen.push(v);
        v.listeners.push(this);
        _ref = v.changers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          chng = _ref[_i];
          chng.updates.push(this);
          this.level = Math.max(this.level, chng.level + 1);
        }
        bfsUpdate([this]);
      }
      start_notify_collect(this);
      changedSave = v.changed;
      v.changed = true;
      this.fn.apply(this.ctx);
      v.changed = changedSave;
      end_notify_collect();
      return this;
    };
    DVLFunctionObject.prototype.remove = function() {
      var k, l, queue, v, _i, _j, _len, _len2, _ref, _ref2;
      delete registerers[this.id];
      bfsZero([this]);
      queue = [];
      for (k in registerers) {
        l = registerers[k];
        if (dvl.intersectSize(l.change, this.listen) > 0) {
          queue.push(l);
          l.updates.splice(l.updates.indexOf(l), 1);
        }
      }
      _ref = this.change;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        v.changers.splice(v.changers.indexOf(this), 1);
      }
      _ref2 = this.listen;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        v = _ref2[_j];
        v.listeners.splice(v.listeners.indexOf(this), 1);
      }
      bfsUpdate(queue);
      return null;
    };
    return DVLFunctionObject;
  })();
  dvl.register = function(_arg) {
    var c, change, changedSave, ctx, fn, fo, force, i, id, k, l, listen, listenConst, name, noRun, v, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m;
    ctx = _arg.ctx, fn = _arg.fn, listen = _arg.listen, change = _arg.change, name = _arg.name, force = _arg.force, noRun = _arg.noRun;
    if (curNotifyListener) {
      throw 'cannot call register from within a notify';
    }
    if (typeof fn !== 'function') {
      throw 'fn must be a function';
    }
    for (k in registerers) {
      l = registerers[k];
      if (l.ctx === ctx && l.fn === fn) {
        throw 'called twice';
      }
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
      nextObjId += 1;
      id = (name || 'fn') + '_' + nextObjId;
      fo = new DVLFunctionObject(id, ctx, fn, listen, change);
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
      for (k in registerers) {
        l = registerers[k];
        if (dvl.intersectSize(change, l.listen) > 0) {
          fo.updates.push(l);
        }
        if (dvl.intersectSize(listen, l.change) > 0) {
          l.updates.push(fo);
          fo.level = Math.max(fo.level, l.level + 1);
        }
      }
      registerers[id] = fo;
      bfsUpdate([fo]);
    }
    if (!noRun) {
      changedSave = [];
      for (i = 0, _len4 = listen.length; i < _len4; i++) {
        l = listen[i];
        changedSave[i] = l.changed;
        l.changed = true;
      }
      for (_l = 0, _len5 = listenConst.length; _l < _len5; _l++) {
        l = listenConst[_l];
        l.changed = true;
      }
      start_notify_collect(fo);
      fn.apply(ctx);
      end_notify_collect();
      for (i = 0, _len6 = changedSave.length; i < _len6; i++) {
        c = changedSave[i];
        listen[i].changed = c;
      }
      for (_m = 0, _len7 = listenConst.length; _m < _len7; _m++) {
        l = listenConst[_m];
        l.changed = false;
      }
    }
    return fo;
  };
  dvl.clearAll = function() {
    var k, l, v;
    for (k in registerers) {
      l = registerers[k];
      l.listen = l.change = l.updates = null;
    }
    for (k in variables) {
      v = variables[k];
      v.listeners = v.changers = null;
    }
    nextObjId = 1;
    constants = {};
    variables = {};
    registerers = {};
    return null;
  };
  levelPriorityQueue = (function() {
    var len, minLevel, queue;
    queue = [];
    minLevel = Infinity;
    len = 0;
    return {
      push: function(l) {
        var _name;
        len += 1;
        minLevel = Math.min(minLevel, l.level);
        (queue[_name = l.level] || (queue[_name] = [])).push(l);
        return null;
      },
      shift: function() {
        len -= 1;
        while (!queue[minLevel] || queue[minLevel].length === 0) {
          minLevel += 1;
        }
        return queue[minLevel].pop();
      },
      length: function() {
        return len;
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
    return null;
  };
  end_notify_collect = function() {
    curCollectListener = null;
    dvl.notify = init_notify;
    dvl.notify.apply(null, toNotify);
    toNotify = null;
    return null;
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
    return null;
  };
  within_notify = function() {
    var l, v, _i, _j, _len, _len2, _ref;
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
      _ref = v.listeners;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        l = _ref[_j];
        if (!l.visited) {
          levelPriorityQueue.push(l);
        }
      }
    }
    return null;
  };
  init_notify = function() {
    var k, l, v, _i, _j, _k, _len, _len2, _len3, _ref;
    if (curNotifyListener) {
      throw 'bad stuff happened init';
    }
    lastNotifyRun = [];
    changedInNotify = [];
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      v = arguments[_i];
      if (!variables[v.id]) {
        continue;
      }
      changedInNotify.push(v);
      lastNotifyRun.push(v.id);
      _ref = v.listeners;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        l = _ref[_j];
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
      lastNotifyRun.push(curNotifyListener.id);
      curNotifyListener.fn.apply(curNotifyListener.ctx);
    }
    curNotifyListener = null;
    dvl.notify = init_notify;
    for (_k = 0, _len3 = changedInNotify.length; _k < _len3; _k++) {
      v = changedInNotify[_k];
      v.resetChanged();
    }
    for (k in registerers) {
      l = registerers[k];
      l.visited = false;
    }
    return null;
  };
  dvl.notify = init_notify;
  dvl.graphToDot = function(lastTrace, showId) {
    var color, dot, execOrder, fnName, id, k, l, level, levels, nameMap, pos, v, varName, w, _i, _j, _k, _len, _len2, _len3, _name, _ref, _ref2;
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
      fnName = l.id;
      fnName = fnName + ' (' + l.level + ')';
      fnName = '"' + fnName + '"';
      nameMap[l.id] = fnName;
    }
    for (id in variables) {
      v = variables[id];
      varName = id;
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
      _ref = l.listen;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        color = execOrder[v.id] && execOrder[l.id] ? 'red' : 'black';
        dot.push("  " + nameMap[v.id] + " -> " + nameMap[l.id] + " [color=" + color + "];");
      }
      _ref2 = l.change;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        w = _ref2[_j];
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
    jQuery.post('http://localhost:8124/' + file, g);
    return null;
  };
  return dvl.postLatest = function(file, showId) {
    var g;
    file || (file = 'dvl_graph_latest');
    g = dvl.graphToDot(true, showId);
    jQuery.post('http://localhost:8124/' + file, g);
    return null;
  };
})();
dvl.alwaysLazy = function(v, fn) {
  return function() {
    v.setLazy(fn);
    return dvl.notify(v);
  };
};
dvl.zero = dvl["const"](0, 'zero');
dvl["null"] = dvl["const"](null, 'null');
dvl.ident = function(x) {
  return x;
};
dvl.identity = dvl["const"](dvl.ident, 'identity');
dvl.acc = function(c) {
  var acc, column, makeAcc;
  column = dvl.wrapConstIfNeeded(c);
  acc = dvl.def(null, "acc_" + (column.get()));
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
  var dbgPrint, note, obj;
  if (arguments.length === 1) {
    obj = arguments[0];
    dbgPrint = function() {
      return debug(obj.get());
    };
  } else {
    note = arguments[0];
    obj = arguments[1];
    dbgPrint = function() {
      return debug(note, obj.get());
    };
  }
  dvl.register({
    fn: dbgPrint,
    listen: [obj],
    name: 'debug'
  });
  return null;
};
dvl.assert = function(_arg) {
  var allowNull, data, fn, msg;
  data = _arg.data, fn = _arg.fn, msg = _arg.msg, allowNull = _arg.allowNull;
  msg || (msg = "" + obj.id + " failed its assert test");
    if (allowNull != null) {
    allowNull;
  } else {
    allowNull = true;
  };
  verifyAssert(function() {
    var d;
    d = data.get();
    if ((d !== null || allowNull) && !fn(d)) {
      throw msg;
    }
  });
  dvl.register({
    fn: verifyAssert,
    listen: [obj],
    name: 'assert_fn'
  });
  return null;
};
dvl.apply = function(_arg) {
  var allowNull, apply, args, fn, invalid, name, ret;
  fn = _arg.fn, args = _arg.args, name = _arg.name, invalid = _arg.invalid, allowNull = _arg.allowNull;
  fn = dvl.wrapConstIfNeeded(fn);
  if (!args) {
    throw 'dvl.apply only makes scense with at least one argument';
  }
  if (dvl.typeOf(args) !== 'array') {
    args = [args];
  }
  invalid = invalid != null ? invalid : null;
  ret = dvl.def(invalid, name || 'apply_return');
  apply = function() {
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
      if (v === null) {
        nulls = true;
      }
      send.push(v);
    }
    if (!nulls || allowNull) {
      r = f.apply(null, send);
      if (r !== void 0) {
        ret.set(r);
        return dvl.notify(ret);
      }
    } else {
      ret.set(invalid);
      return dvl.notify(ret);
    }
  };
  dvl.register({
    fn: apply,
    listen: args.concat([fn]),
    change: [ret],
    name: (name || 'apply') + '_fn'
  });
  return ret;
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
    throw 'dvl.filter: no data';
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
    var d, m, o;
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
      array.push(d);
      while (m < array.get().length) {
        array.shift();
      }
      dvl.notify(array);
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
dvl.delay = function(_arg) {
  var data, name, out, time, timeoutFn, timer;
  data = _arg.data, time = _arg.time, name = _arg.name;
  if (!data) {
    throw 'you must provide a data';
  }
  if (!time) {
    throw 'you must provide a time';
  }
  data = dvl.wrapConstIfNeeded(data);
  time = dvl.wrapConstIfNeeded(time);
  timer = null;
  out = dvl.def(data.get());
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
      t = time.get();
      if (t > 0) {
        return timer = setTimeout(timeoutFn, t);
      } else {
        return out.set(data.get()).notify();
      }
    }
  });
  return out;
};
dvl.json2 = (function() {
  var addHoock, fo, getData, getError, initQueue, inputChange, makeRequest, maybeDone, nextQueryId, queries;
  nextQueryId = 0;
  initQueue = [];
  queries = {};
  maybeDone = function(request) {
    var notify, q, _i, _j, _len, _len2;
    for (_i = 0, _len = request.length; _i < _len; _i++) {
      q = request[_i];
      if (q.status !== 'ready') {
        return;
      }
    }
    notify = [];
    for (_j = 0, _len2 = request.length; _j < _len2; _j++) {
      q = request[_j];
      if (q.data !== void 0) {
        q.res.set(q.data);
        notify.push(q.res);
        q.stauts = '';
        delete q.data;
      }
    }
    return dvl.notify.apply(null, notify);
  };
  getData = function(data) {
    var d, i, m, mappedData, md, q, _len;
    q = this.q;
    if (this.url === q.url.get()) {
      if (q.map) {
        m = q.map;
        mappedData = [];
        for (i = 0, _len = data.length; i < _len; i++) {
          d = data[i];
          md = m(d);
          if (md !== void 0) {
            mappedData.push(md);
          }
        }
        data = mappedData;
      }
      if (q.fn) {
        data = q.fn(data);
      }
      q.data = data;
    }
    q.status = 'ready';
    q.curAjax = null;
    return maybeDone(this.request);
  };
  getError = function(xhr, textStatus) {
    var q, request, url;
    if (textStatus === "abort") {
      return;
    }
    q = this.q;
    url = this.url;
    request = this.request;
    return setTimeout((function() {
      if (url === q.url.get()) {
        q.data = null;
        if (q.onError) {
          q.onError(textStatus);
        }
      }
      q.status = 'ready';
      q.curAjax = null;
      return maybeDone(request);
    }), 1);
  };
  makeRequest = function(q, request) {
    var ctx, url;
    q.status = 'requesting';
    url = q.url.get();
    ctx = {
      q: q,
      request: request,
      url: url
    };
    if (url != null) {
      if (q.curAjax) {
        q.curAjax.abort();
      }
      return q.curAjax = jQuery.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: getData,
        error: getError,
        context: ctx
      });
    } else {
      return setTimeout((function() {
        return getData.call(ctx, null);
      }), 1);
    }
  };
  inputChange = function() {
    var bundle, id, q, _i, _len;
    bundle = [];
    for (id in queries) {
      q = queries[id];
      if (!q.url.hasChanged()) {
        continue;
      }
      if (q.group.get()) {
        if (q.status === 'virgin') {
          if (q.url.get()) {
            initQueue.push(q);
            makeRequest(q, initQueue);
          } else {
            q.status = '';
          }
        } else {
          bundle.push(q);
        }
      } else {
        makeRequest(q, [q]);
      }
    }
    if (bundle.length > 0) {
      for (_i = 0, _len = bundle.length; _i < _len; _i++) {
        q = bundle[_i];
        makeRequest(q, bundle);
      }
    }
    return null;
  };
  fo = null;
  addHoock = function(listen, change) {
    if (fo) {
      fo.addListen(listen);
      inputChange();
    } else {
      fo = dvl.register({
        fn: inputChange,
        listen: [listen],
        force: true,
        name: 'xsr_man'
      });
    }
    return null;
  };
  return function(_arg) {
    var fn, group, map, name, onError, q, type, url;
    url = _arg.url, type = _arg.type, map = _arg.map, fn = _arg.fn, onError = _arg.onError, group = _arg.group, name = _arg.name;
    if (!url) {
      throw 'it does not make sense to not have a url';
    }
    if (map && dvl.knows(map)) {
      throw 'the map function must be non DVL variable';
    }
    if (fn && dvl.knows(fn)) {
      throw 'the fn function must be non DVL variable';
    }
    url = dvl.wrapConstIfNeeded(url);
    if (dvl.knows(type)) {
      type = type.get();
    }
    group = dvl.wrapConstIfNeeded(group != null ? group : true);
    nextQueryId++;
    q = {
      id: nextQueryId,
      url: url,
      res: dvl.def(null, name || 'json_data'),
      status: 'virgin',
      type: type || 'json',
      group: group,
      onError: onError
    };
    if (map) {
      q.map = map;
    }
    if (fn) {
      q.fn = fn;
    }
    queries[q.id] = q;
    addHoock(url, q.res);
    return q.res;
  };
})();
dvl.json = function(options) {
  var g, getData, gets, listen, maybeStop, opt, query, ret, waitForCount, _i, _len;
  if (dvl.typeOf(options) !== 'array') {
    options = [options];
  }
  listen = [];
  ret = [];
  query = 0;
  waitForCount = {};
  gets = [];
  for (_i = 0, _len = options.length; _i < _len; _i++) {
    opt = options[_i];
    g = {};
    if (!opt.url) {
      throw 'it does not make sense to not have a url';
    }
    g.url = dvl.wrapConstIfNeeded(opt.url);
    listen.push(g.url);
    if (opt.map) {
      g.map = dvl.wrapConstIfNeeded(opt.map);
      listen.push(g.map);
    } else {
      if (opt.fn) {
        g.fn = dvl.wrapConstIfNeeded(opt.fn);
        listen.push(g.fn);
      }
    }
    g.out = dvl.def(opt.init, 'json_got');
    ret.push(g.out);
    gets.push(g);
  }
  maybeStop = function(q) {
    var get, notify, _j, _len2;
    if (waitForCount[q] === 0) {
      delete waitForCount[q];
      notify = [];
      for (_j = 0, _len2 = gets.length; _j < _len2; _j++) {
        get = gets[_j];
        if (get.got !== void 0) {
          get.out.set(get.got);
          notify.push(get.out);
          delete get.got;
        }
      }
      return dvl.notify.apply(null, notify);
    }
  };
  getData = function(json) {
    var i, m, md;
    g = gets[this.i];
    if (g.map) {
      m = g.map.get();
      i = 0;
      while (i < json.length) {
        md = m(json[i]);
        if (md != null) {
          json[i] = md;
        }
        i++;
      }
    } else {
      if (g.fn) {
        json = g.fn.get()(json);
      }
    }
    g.got = json;
    waitForCount[this.q] -= 1;
    return maybeStop(this.q);
  };
  query = function() {
    var g, i, u;
    query += 1;
    waitForCount[query] = 0;
    for (i in gets) {
      g = gets[i];
      if (g.url.hasChanged()) {
        u = g.url.get();
        if (u !== null) {
          jQuery.ajax({
            url: u,
            type: 'GET',
            dataType: 'json',
            success: getData,
            error: function() {
              return debug("error in json");
            },
            context: {
              i: i,
              q: query
            }
          });
          waitForCount[query] += 1;
        } else {
          g.got = null;
        }
      }
    }
    maybeStop(query);
    return null;
  };
  dvl.register({
    fn: query,
    listen: listen,
    change: ret,
    name: 'json'
  });
  return ret;
};
dvl.resizer = function(sizeRef, marginRef, options) {
  var fh, fw, marginDefault, onResize;
  if (!dvl.knows(sizeRef)) {
    throw 'No size given';
  }
  marginDefault = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  };
  if (options) {
    if (options.width) {
      fw = dvl.typeOf(options.width) === 'function' ? options.width : dvl.identity;
    }
    if (options.height) {
      fh = dvl.typeOf(options.height) === 'function' ? options.height : dvl.identity;
    }
  } else {
    fw = dvl.ident;
    fh = dvl.ident;
  }
  onResize = function() {
    var e, height, margin, width;
    margin = marginRef ? marginRef.get() : marginDefault;
    if (options.selector) {
      e = jQuery(options.selector);
      width = e.width();
      height = e.height();
    } else {
      width = document.body.clientWidth;
      height = document.body.clientHeight;
    }
    if (fw) {
      width = fw(width) - margin.right - margin.left;
    }
    if (fh) {
      height = fh(height) - margin.top - margin.bottom;
    }
    if (options.minWidth) {
      width = Math.max(width, options.minWidth);
    }
    if (options.maxWidth) {
      width = Math.min(width, options.maxWidth);
    }
    if (options.minHeight) {
      height = Math.max(height, options.minHeight);
    }
    if (options.maxHeight) {
      height = Math.min(height, options.maxHeight);
    }
    sizeRef.set({
      width: width,
      height: height
    });
    return dvl.notify(sizeRef);
  };
  d3.select(window).on('resize', onResize);
  onResize();
  return null;
};
dvl.format = function(string, subs) {
  var list, makeString, out, s, _i, _j, _len, _len2;
  out = dvl.def(null, 'formated_out');
  for (_i = 0, _len = subs.length; _i < _len; _i++) {
    s = subs[_i];
    if (!dvl.knows(s)) {
      if (s.fn) {
        s.fn = dvl.wrapConstIfNeeded(s.fn);
      }
      s.data = dvl.wrapConstIfNeeded(s.data);
    }
  }
  makeString = function() {
    var args, invalid, s, v, _j, _len2;
    args = [string];
    invalid = false;
    for (_j = 0, _len2 = subs.length; _j < _len2; _j++) {
      s = subs[_j];
      if (dvl.knows(s)) {
        v = s.get();
        if (v === null) {
          invalid = true;
          break;
        }
        args.push(v);
      } else {
        v = s.data.get();
        if (v === null) {
          invalid = true;
          break;
        }
        if (s.fn) {
          v = s.fn.get()(v);
        }
        args.push(v);
      }
    }
    out.set(invalid ? null : sprintf.apply(null, args));
    return dvl.notify(out);
  };
  list = [];
  for (_j = 0, _len2 = subs.length; _j < _len2; _j++) {
    s = subs[_j];
    if (dvl.knows(s)) {
      list.push(s);
    } else {
      list.push(s.data);
    }
  }
  dvl.register({
    fn: makeString,
    listen: list,
    change: [out],
    name: 'formater'
  });
  return out;
};
dvl.snap = function(_arg) {
  var acc, data, name, out, updateSnap, value;
  data = _arg.data, acc = _arg.acc, value = _arg.value, name = _arg.name;
  if (!data) {
    throw 'No data given';
  }
  acc = dvl.wrapConstIfNeeded(acc || dvl.identity);
  value = dvl.wrapConstIfNeeded(value);
  name || (name = 'snaped_data');
  out = dvl.def(null, name);
  updateSnap = function() {
    var a, d, dist, ds, dsc, i, minDatum, minDist, minIdx, v, _len;
    ds = data.get();
    a = acc.get();
    v = value.get();
    if (ds && a && v) {
      if (dvl.typeOf(ds) !== 'array') {
        dsc = a(ds);
        a = function(x) {
          return x;
        };
      } else {
        dsc = ds;
      }
      minDist = Infinity;
      minIdx = -1;
      if (dsc) {
        for (i = 0, _len = dsc.length; i < _len; i++) {
          d = dsc[i];
          dist = Math.abs(a(d) - v);
          if (dist < minDist) {
            minDist = dist;
            minIdx = i;
          }
        }
      }
      minDatum = minIdx < 0 ? null : dvl.util.getRow(ds, minIdx);
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
    listen: [data, acc, value],
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
  return null;
};
dvl.scale = {};
(function() {
  dvl.scale.linear = function(options) {
    var change, dom, domainFrom, domainTo, formatRef, invertRef, listenData, makeScaleFn, makeScaleFnEmpty, makeScaleFnSingle, name, numTicks, optDomain, padding, rangeFrom, rangeTo, scaleRef, ticksRef, updateData, _i, _len;
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
    scaleRef = dvl.def(null, name + '_fn');
    invertRef = dvl.def(null, name + '_invert');
    ticksRef = dvl.def(null, name + '_ticks');
    formatRef = dvl.def(null, name + '_format');
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
      return null;
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
      return null;
    };
    makeScaleFnEmpty = function() {
      scaleRef.set(null);
      invertRef.set(null);
      ticksRef.set(null);
      formatRef.set(null);
      dvl.notify(scaleRef, invertRef, ticksRef, formatRef);
      return null;
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
      if (min < max) {
        if (domainFrom !== min || domainTo !== max) {
          domainFrom = min;
          domainTo = max;
          makeScaleFn();
        }
      } else if (min === max) {
        domainFrom = domainTo = min;
        makeScaleFnSingle();
      } else {
        domainFrom = NaN;
        domainTo = NaN;
        makeScaleFnEmpty();
      }
      return null;
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
      fn: makeScaleFn,
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
      return null;
    };
    makeScaleFnEmpty = function() {
      scaleRef.set(null);
      ticksRef.set(null);
      formatRef.set(null);
      bandRef.set(0);
      dvl.notify(scaleRef, ticksRef, formatRef, bandRef);
      return null;
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
      return null;
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
dvl.dataMapper;
dvl.gen = {};
dvl.gen.fromFn = function(fn) {
  var gen;
  gen = dvl.def(null, 'fn_generator');
  gen.setGen(fn, Infinity);
  return gen;
};
dvl.gen.fromValue = function(value, acc, fn) {
  var gen, makeGen;
  value = dvl.wrapConstIfNeeded(value);
  acc = dvl.wrapConstIfNeeded(acc || dvl.identity);
  fn = dvl.wrapConstIfNeeded(fn || dvl.identity);
  gen = dvl.def(null, 'value_generator');
  makeGen = function() {
    var a, f, g, rv, v;
    a = acc.get();
    f = fn.get();
    v = value.get();
    if ((a != null) && (f != null) && (v != null)) {
      rv = f(a(v));
      g = function() {
        return rv;
      };
      gen.setGen(g);
    } else {
      gen.setGen(null);
    }
    return dvl.notify(gen);
  };
  dvl.register({
    fn: makeGen,
    listen: [value, acc, fn],
    change: [gen],
    name: 'value_make_gen'
  });
  return gen;
};
dvl.gen.fromArray = function(data, acc, fn) {
  var d, gen, makeGen;
  data = dvl.wrapConstIfNeeded(data);
  acc = dvl.wrapConstIfNeeded(acc || dvl.identity);
  fn = dvl.wrapConstIfNeeded(fn || dvl.identity);
  gen = dvl.def(null, 'array_generator');
  d = [];
  makeGen = function() {
    var a, f, g;
    a = acc.get();
    f = fn.get();
    d = data.get();
    if ((a != null) && (f != null) && (d != null) && d.length > 0) {
      g = function(i) {
        i = i % d.length;
        return f(a(d[i], i));
      };
      gen.setGen(g, data.get().length);
    } else {
      gen.setGen(null);
    }
    return dvl.notify(gen);
  };
  dvl.register({
    fn: makeGen,
    listen: [data, acc, fn],
    change: [gen],
    name: 'array_make_gen'
  });
  return gen;
};
dvl.gen.fromRowData = dvl.gen.fromArray;
dvl.gen.fromColumnData = function(data, acc, fn) {
  var d, gen, makeGen;
  data = dvl.wrapConstIfNeeded(data);
  acc = dvl.wrapConstIfNeeded(acc || dvl.identity);
  fn = dvl.wrapConstIfNeeded(fn || dvl.identity);
  gen = dvl.def(null, 'array_generator');
  d = [];
  makeGen = function() {
    var a, dObj, f, g;
    a = acc.get();
    f = fn.get();
    dObj = data.get();
    if ((a != null) && (f != null) && (dObj != null) && (d = a(dObj))) {
      g = function(i) {
        i = i % d.length;
        return f(d[i]);
      };
      gen.setGen(g, d.length);
    } else {
      gen.setGen(null);
    }
    return dvl.notify(gen);
  };
  dvl.register({
    fn: makeGen,
    listen: [data, acc, fn],
    change: [gen],
    name: 'array_make_gen'
  });
  return gen;
};
dvl.gen.equal = function(genA, genB, retTrue, retFalse) {
  var gen, makeGen;
  if (retTrue === void 0) {
    retTrue = true;
  }
  if (retFalse === void 0) {
    retFalse = false;
  }
  retTrue = dvl.wrapConstIfNeeded(retTrue);
  retFalse = dvl.wrapConstIfNeeded(retFalse);
  gen = dvl.def(null, 'equal_generator');
  makeGen = function() {
    var a, b, ha, hb, lenA, lenB, rfg, rfl, rtg, rtl;
    a = genA.gen();
    b = genB.gen();
    ha = a != null;
    hb = b != null;
    rtg = retTrue.gen();
    rfg = retFalse.gen();
    rtl = retTrue.len();
    rfl = retFalse.len();
    if (ha && ha) {
      lenA = genA.len() || Infinity;
      lenB = genB.len() || Infinity;
      gen.setGen((function(i) {
        if (a(i) === b(i)) {
          return rtg(i);
        } else {
          return rfg(i);
        }
      }), Math.min(lenA, lenB, rtl, rfl));
    } else if (!ha && !hb) {
      gen.setGen(rtg, rtl);
    } else {
      gen.setGen(rfg, rfl);
    }
    return dvl.notify(gen);
  };
  dvl.register({
    fn: makeGen,
    listen: [genA, genB, retTrue, retFalse],
    change: [gen],
    name: 'equal_make_gen'
  });
  return gen;
};
generator_maker_maker = function(combiner, name) {
  return function() {
    var args, gen, makeGen;
    args = Array.prototype.slice.apply(arguments);
    gen = dvl.def(null, name + '_generator');
    makeGen = function() {
      var arg, arg_gen, g, gens, lens, valid, _i, _len;
      valid = args.length > 0;
      gens = [];
      lens = [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        arg_gen = arg.gen();
        if (arg_gen === null) {
          valid = false;
          break;
        }
        gens.push(arg_gen);
        lens.push(arg.len());
      }
      if (valid) {
        g = function(i) {
          var cgen, gis, _j, _len2;
          gis = [];
          for (_j = 0, _len2 = gens.length; _j < _len2; _j++) {
            cgen = gens[_j];
            gis.push(cgen(i));
          }
          return combiner.apply(null, gis);
        };
        gen.setGen(g, Math.min.apply(null, lens));
      } else {
        gen.setGen(null);
      }
      dvl.notify(gen);
      return null;
    };
    dvl.register({
      fn: makeGen,
      listen: args,
      change: [gen],
      name: name + '_make_gen'
    });
    return gen;
  };
};
dvl.gen.add = generator_maker_maker((function(a, b, c) {
  return a + b + (c || 0);
}), 'add');
dvl.gen.sub = generator_maker_maker((function(a, b, c) {
  return a - b - (c || 0);
}), 'sub');
dvl.svg = {};
(function() {
  var calcLength, gen_subDouble, gen_subHalf, getNextClipPathId, getNodeKey, initClip, initGroup, listen_attr, makeAnchors, nextClipPathId, processDim2, processDim3, processDim4, processOptions, processProps, removeUndefined, reselectUpdate, selectEnterExit, update_attr;
  processOptions = function(options, mySvg, myClass) {
    var out;
    if (!options.panel) {
      throw 'No panel defined.';
    }
    out = {
      mySvg: mySvg,
      myClass: myClass
    };
    if (options) {
      out.duration = dvl.wrapConstIfNeeded(options.duration || dvl.zero);
      out.classStr = options.classStr;
      out.clip = options.clip;
      out.on = options.on;
    }
    return out;
  };
  processProps = function(props) {
    var k, p, v;
    if (!props) {
      throw 'No props defined.';
    }
    p = {};
    for (k in props) {
      v = props[k];
      p[k] = dvl.wrapConstIfNeeded(v);
    }
    return p;
  };
  gen_subHalf = generator_maker_maker((function(a, b) {
    return a - b / 2;
  }), 'sub_half');
  gen_subDouble = generator_maker_maker((function(a, b) {
    return (a - b) * 2;
  }), 'sub_double');
  processDim2 = function(props, panelWidth, left, right) {
    if (!props[left]) {
      if (props[right]) {
        props[left] = dvl.gen.sub(panelWidth, props[right]);
      } else {
        props[left] = dvl.zero;
      }
    }
    return null;
  };
  processDim3 = function(props, panelWidth, left, width, right) {
    if (props[left]) {
      if (!props[width]) {
        props[width] = dvl.gen.sub(panelWidth, props[left], props[right]);
      }
    } else {
      if (props[width]) {
        props[left] = dvl.gen.sub(panelWidth, props[width], props[right]);
      } else {
        props[left] = dvl.zero;
        props[width] = panelWidth;
      }
    }
    return null;
  };
  processDim4 = function(props, panelWidth, left, width, right, center) {
    if (props[left]) {
      if (!props[width]) {
        if (props[center]) {
          props[width] = gen_subDouble(props[canter], props[left]);
        } else {
          props[width] = dvl.gen.sub(panelWidth, props[left], props[right]);
        }
      }
    } else {
      if (props[width]) {
        if (props[center]) {
          props[left] = gen_subHalf(props[center], props[width]);
        } else {
          props[left] = dvl.gen.sub(panelWidth, props[width], props[right]);
        }
      } else {
        if (props[center]) {
          props[left] = dvl.gen.sub(props[center], dvl["const"](10));
          props[width] = dvl["const"](20);
        } else {
          props[left] = dvl.zero;
          props[width] = panelWidth;
        }
      }
    }
    return null;
  };
  removeUndefined = function(obj) {
    var k, p;
    for (k in obj) {
      p = obj[k];
      if (p === void 0) {
        delete obj[k];
      }
    }
    return obj;
  };
  initGroup = function(panel, options) {
    var g;
    g = panel.g.append('svg:g');
    g.attr('class', options.classStr) === options.classStr;
    return g;
  };
  initClip = function(panel, g, options) {
    var cp, cpid;
    if (options.clip) {
      cpid = getNextClipPathId();
      cp = g.append('svg:clipPath').attr('id', cpid).append('svg:rect').attr('x', 0).attr('y', 0).attr('width', panel.width.gen()).attr('height', panel.height.gen());
      g.attr('clip-path', 'url(#' + cpid + ')');
      return cp;
    } else {
      return null;
    }
  };
  calcLength = function(props) {
    var gen, l, length, what;
    length = +Infinity;
    for (what in props) {
      gen = props[what];
      l = gen.len();
      if (l < length) {
        length = l;
      }
    }
    if (length === Infinity) {
      return 1;
    } else {
      return length;
    }
  };
  nextClipPathId = 0;
  getNextClipPathId = function() {
    nextClipPathId += 1;
    return 'cp_' + nextClipPathId;
  };
  getNodeKey = function(n) {
    return n.getAttribute('id');
  };
  selectEnterExit = function(g, options, props, numMarks) {
    var id_gen, join, key_gen, m, onFn, sel, what, _ref;
    if (props.key && props.key.gen()) {
      key_gen = props.key.gen();
      id_gen = function(i) {
        return 'i_' + String(key_gen(i)).replace(/[^\w-:.]/g, '');
      };
      join = {
        dataKey: id_gen,
        nodeKey: getNodeKey
      };
    } else {
      join = null;
    }
    sel = g.selectAll("" + options.mySvg + "." + options.myClass).data(pv.range(0, numMarks), join);
    sel.exit().remove();
    m = sel.enter("svg:" + options.mySvg);
    if (props.key && props.key.gen()) {
      m.attr('id', id_gen);
    }
    m.attr('class', options.myClass);
    if (options.on) {
      _ref = options.on;
      for (what in _ref) {
        onFn = _ref[what];
        m.on(what, onFn);
      }
    }
    return m;
  };
  reselectUpdate = function(g, options, duration) {
    var m;
    m = g.selectAll("" + options.mySvg + "." + options.myClass);
    if (duration > 0) {
      m = m.transition().duration(duration);
    }
    return m;
  };
  makeAnchors = function(anchors, options) {
    var a, anchor, av, info, lazy;
    anchor = [];
    for (a in anchors) {
      info = anchors[a];
      av = dvl.def(null, "" + options.myClass + "_anchor_" + a);
      anchor[a] = av;
      lazy = dvl.alwaysLazy(av, info.calc);
      dvl.register({
        fn: lazy,
        listen: info.dep,
        change: [av],
        name: "lazy_anchor_" + a
      });
    }
    return anchor;
  };
  dvl.svg.canvas = function(options) {
    var bg, marginDef, marginRef, onFn, pHeight, pWidth, resize, selector, sizeDef, sizeRef, svg, vis, what, _ref;
    selector = options.selector;
    if (!selector) {
      throw 'no selector';
    }
    sizeRef = options.size;
    marginRef = options.margin;
    sizeDef = {
      width: 600,
      height: 400
    };
    marginDef = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
    pWidth = dvl.def(0, 'svg_panel_width');
    pHeight = dvl.def(0, 'svg_panel_height');
    svg = d3.select(selector).append('svg:svg');
    if (options.classStr) {
      svg.attr('class', options.classStr);
    }
    vis = svg.append('svg:g').attr('class', 'main');
    bg = vis.append('svg:rect').attr('class', 'background');
    if (options.on) {
      _ref = options.on;
      for (what in _ref) {
        onFn = _ref[what];
        bg.on(what, onFn);
      }
    }
    resize = function() {
      var h, margin, notify, size, w;
      size = sizeRef ? sizeRef.get() : sizeDef;
      margin = marginRef ? marginRef.get() : marginDef;
      w = size.width - margin.left - margin.right;
      h = size.height - margin.top - margin.bottom;
      notify = [];
      if (pWidth.get() !== w) {
        pWidth.set(w);
        notify.push(pWidth);
      }
      if (pHeight !== h) {
        pHeight.set(h);
        notify.push(pHeight);
      }
      dvl.notify.apply(null, notify);
      svg.attr('width', size.width).attr('height', size.height);
      vis.attr('transform', "translate(" + margin.left + "," + margin.top + ")").attr('width', w).attr('height', h);
      return bg.attr('width', w).attr('height', h);
    };
    dvl.register({
      fn: resize,
      listen: [sizeRef, marginRef],
      change: [pWidth, pHeight],
      name: 'canvas_resize'
    });
    return {
      g: vis,
      width: pWidth,
      height: pHeight
    };
  };
  dvl.svg.mouse = function(_arg) {
    var flipX, flipY, fnX, fnY, lastMouse, outX, outY, panel, recorder, x, y;
    panel = _arg.panel, outX = _arg.outX, outY = _arg.outY, fnX = _arg.fnX, fnY = _arg.fnY, flipX = _arg.flipX, flipY = _arg.flipY;
    x = dvl.wrapVarIfNeeded(outX, 'mouse_x');
    y = dvl.wrapVarIfNeeded(outY, 'mouse_y');
    fnX = dvl.wrapConstIfNeeded(fnX || dvl.identity);
    fnY = dvl.wrapConstIfNeeded(fnY || dvl.identity);
    flipX = dvl.wrapConstIfNeeded(flipX || false);
    flipY = dvl.wrapConstIfNeeded(flipY || false);
    lastMouse = [-1, -1];
    recorder = function() {
      var fx, fy, h, m, mx, my, w;
      m = lastMouse = d3.event ? d3.svg.mouse(panel.g.node()) : lastMouse;
      w = panel.width.get();
      h = panel.height.get();
      fx = fnX.get();
      fy = fnY.get();
      mx = m[0];
      my = m[1];
      if ((0 <= mx && mx <= w) && (0 <= my && my <= h)) {
        if (flipX.get()) {
          mx = w - mx;
        }
        if (flipY.get()) {
          my = h - my;
        }
        if (fx) {
          x.set(fx(mx));
        }
        if (fy) {
          y.set(fy(my));
        }
      } else {
        x.set(null);
        y.set(null);
      }
      return dvl.notify(x, y);
    };
    panel.g.on('mousemove', recorder).on('mouseout', recorder);
    dvl.register({
      fn: recorder,
      listen: [fnX, fnY, flipX, flipY],
      change: [x, y],
      name: 'mouse_recorder'
    });
    return {
      x: x,
      y: y
    };
  };
  listen_attr = {};
  update_attr = {};
  listen_attr.panels = ['left', 'top', 'width', 'height'];
  update_attr.panels = function(m, p, prev) {
    var gen, height, left, left_gen, top, top_gen, width;
    gen = prev ? 'genPrev' : 'gen';
    left = p.left;
    top = p.top;
    if (prev || left.hasChanged() || top.hasChanged()) {
      left_gen = left[gen]();
      top_gen = top[gen]();
      m.attr('transform', (function(i) {
        return "translate(" + (left_gen(i)) + "," + (top_gen(i)) + ")";
      }));
    }
    width = p.width;
    if (width && (prev || width.hasChanged())) {
      m.attr('width', width[gen]());
    }
    height = p.height;
    if (height && (prev || height.hasChanged())) {
      m.attr('height', height[gen]());
    }
    return null;
  };
  dvl.svg.panels = function(options) {
    var clip, content, g, heights, k, listen, o, p, panel, render, widths, _i, _len, _ref;
    o = processOptions(options, 'g', 'panels');
    if (o.clip == null) {
      o.clip = false;
    }
    p = processProps(options.props);
    panel = options.panel;
    processDim3(p, panel.width, 'left', 'width', 'right');
    processDim3(p, panel.height, 'top', 'height', 'bottom');
    g = initGroup(panel, o);
    clip = initClip(panel, g, o);
    content = options.content;
    widths = [];
    heights = [];
    render = function() {
      var dimChange, dur, hg, i, len, m, ms, msLen, wg;
      len = calcLength(p);
      if (len > 0) {
        m = selectEnterExit(g, o, p, len);
        update_attr[o.myClass](m, p, true);
        dimChange = panel.width.hasChanged() || panel.height.hasChanged();
        if (dimChange) {
          if (clip) {
            clip.attr('width', panel.width.get()).attr('height', panel.height.get());
          }
          dur = 0;
        } else {
          dur = o.duration.get();
        }
        m = g.selectAll('g');
        update_attr[o.myClass](m, p);
        ms = m[0];
        msLen = ms.length;
        i = 0;
        wg = p.width.gen();
        hg = p.height.gen();
        while (i < msLen) {
          if (!widths[i]) {
            widths[i] = dvl.def(wg(i), 'width_' + i);
            heights[i] = dvl.def(hg(i), 'height_' + i);
          }
          content(i, {
            g: d3.select(ms[i]),
            width: widths[i],
            height: heights[i]
          });
          i++;
        }
        g.style('display', null);
      } else {
        g.style('display', 'none');
      }
      return null;
    };
    listen = [panel.width, panel.height];
    _ref = listen_attr[o.myClass];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      listen.push(p[k]);
    }
    dvl.register({
      fn: render,
      listen: listen,
      name: 'panels_render'
    });
    return null;
  };
  listen_attr.line = ['left', 'top', 'stroke'];
  update_attr.line = function(m, p, prev) {
    var gen, left, left_gen, stroke, top, top_gen;
    gen = prev ? 'genPrev' : 'gen';
    left = p.left;
    if (prev || left.hasChanged()) {
      left_gen = left[gen]();
      m.attr('x1', left_gen);
      m.attr('x2', (function(i) {
        return left_gen(i + 1);
      }));
    }
    top = p.top;
    if (prev || top.hasChanged()) {
      top_gen = top[gen]();
      m.attr('y1', top_gen);
      m.attr('y2', (function(i) {
        return top_gen(i + 1);
      }));
    }
    stroke = p.stroke;
    if (stroke && (prev || stroke.hasChanged())) {
      m.style('stroke', stroke[gen]());
    }
    return null;
  };
  dvl.svg.line = function(options) {
    var anchors, clip, g, k, listen, o, p, panel, render, _i, _len, _ref;
    o = processOptions(options, 'line', 'line');
    if (o.clip == null) {
      o.clip = true;
    }
    p = processProps(options.props);
    panel = options.panel;
    processDim2(p, panel.width, 'left', 'right');
    processDim2(p, panel.height, 'top', 'bottom');
    g = initGroup(panel, o);
    clip = initClip(panel, g, o);
    anchors = {
      midpoint: {
        dep: [p.left, p.top],
        calc: function() {
          var as, i, length, x, y;
          length = calcLength(p);
          x = p.left.gen();
          y = p.top.gen();
          as = [];
          i = 0;
          while (i < length - 1) {
            as.push({
              x: (x(i) + x(i + 1)) / 2,
              y: (y(i) + y(i + 1)) / 2
            });
            i += 1;
          }
          return as;
        }
      }
    };
    render = function() {
      var dur, len, m;
      len = Math.max(0, calcLength(p) - 1);
      m = selectEnterExit(g, o, p, len);
      update_attr[o.myClass](m, p, true);
      if (panel.width.hasChanged() || panel.height.hasChanged()) {
        if (clip) {
          clip.attr('width', panel.width.get()).attr('height', panel.height.get());
        }
        dur = 0;
      } else {
        dur = o.duration.get();
      }
      m = reselectUpdate(g, o, dur);
      update_attr[o.myClass](m, p);
      return null;
    };
    listen = [panel.width, panel.height];
    _ref = listen_attr[o.myClass];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      listen.push(p[k]);
    }
    dvl.register({
      fn: render,
      listen: listen,
      name: 'render_line'
    });
    return makeAnchors(anchors, o);
  };
  dvl.svg.area = function(options) {
    var a, anchors, clip, g, o, p, panel, render;
    o = processOptions(options, 'path', 'area');
    if (o.clip == null) {
      o.clip = false;
    }
    p = processProps(options.props);
    processDim3(p, panel.width, 'left', 'width', 'right');
    processDim3(p, panel.height, 'top', 'height', 'bottom');
    panel = options.panel;
    g = initGroup(panel, o);
    clip = initClip(panel, g, o);
    anchors = {
      midpoint: {
        dep: [p.x, p.y],
        calc: function() {
          var as, i, length, x, y;
          length = calcLength(p);
          x = p.x.gen();
          y = p.y.gen();
          as = [];
          i = 0;
          while (i < length - 1) {
            as.push({
              x: (x(i) + x(i + 1)) / 2,
              y: (y(i) + y(i + 1)) / 2
            });
            i += 1;
          }
          return as;
        }
      }
    };
    a = g.append('svg:path').attr('fill', "#ff0000");
    render = function() {
      var af, dimChange, dur, len, x, y;
      len = calcLength(p);
      x = p.x.gen();
      y = p.y.gen();
      if (len > 0 && x && y) {
        dimChange = panel.width.hasChanged() || panel.height.hasChanged();
        if (clip) {
          clip.attr('width', panel.width.get()).attr('height', panel.height.get());
        }
        dur = dimChange ? 0 : o.duration.get();
        af = d3.svg.area().x(x).y1(y).y0(panel.height.gen());
        a.attr('d', af(d3.range(len)));
        g.style('display', null);
      } else {
        g.style('display', 'none');
      }
      return null;
    };
    dvl.register({
      fn: render,
      listen: [panel.width, panel.height, p.x, p.y],
      name: 'render_area'
    });
    return makeAnchors(anchors, o);
  };
  listen_attr.lines = ['left1', 'left2', 'top1', 'top2', 'stroke'];
  update_attr.lines = function(m, p, prev) {
    var gen, left1, left2, stroke, top1, top2;
    gen = prev ? 'genPrev' : 'gen';
    left1 = p.left1;
    if (prev || left1.hasChanged()) {
      m.attr('x1', left1[gen]());
    }
    left2 = p.left2;
    if (prev || left2.hasChanged()) {
      m.attr('x2', left2[gen]());
    }
    top1 = p.top1;
    if (prev || top1.hasChanged()) {
      m.attr('y1', top1[gen]());
    }
    top2 = p.top2;
    if (prev || top2.hasChanged()) {
      m.attr('y2', top2[gen]());
    }
    stroke = p.stroke;
    if (stroke && (prev || stroke.hasChanged())) {
      m.style('stroke', stroke[gen]());
    }
    return null;
  };
  dvl.svg.lines = function(options) {
    var anchors, clip, g, k, listen, o, p, panel, render, _i, _len, _ref;
    o = processOptions(options, 'line', 'lines');
    if (o.clip == null) {
      o.clip = true;
    }
    p = processProps(options.props);
    panel = options.panel;
    p.left1 || (p.left1 = p.left);
    p.left2 || (p.left2 = p.left);
    p.right1 || (p.right1 = p.right);
    p.right2 || (p.right2 = p.right);
    p.top1 || (p.top1 = p.top);
    p.top2 || (p.top2 = p.top);
    p.bottom1 || (p.bottom1 = p.bottom);
    p.bottom2 || (p.bottom2 = p.bottom);
    removeUndefined(p);
    processDim2(p, panel.width, 'left1', 'right1');
    processDim2(p, panel.width, 'left2', 'right2');
    processDim2(p, panel.height, 'top1', 'bottom1');
    processDim2(p, panel.height, 'top2', 'bottom2');
    g = initGroup(panel, o);
    clip = initClip(panel, g, o);
    anchors = {
      midpoint1: {
        dep: [p.left1, p.top1],
        calc: function() {
          var as, i, length, x, y;
          length = calcLength(p);
          x = p.left1.gen();
          y = p.top1.gen();
          as = [];
          i = 0;
          while (i < length - 1) {
            as.push({
              x: (x(i) + x(i + 1)) / 2,
              y: (y(i) + y(i + 1)) / 2
            });
            i += 1;
          }
          return as;
        }
      },
      midpoint2: {
        dep: [p.left2, p.top2],
        calc: function() {
          var as, i, length, x, y;
          length = calcLength(p);
          x = p.left2.gen();
          y = p.top2.gen();
          as = [];
          i = 0;
          while (i < length - 1) {
            as.push({
              x: (x(i) + x(i + 1)) / 2,
              y: (y(i) + y(i + 1)) / 2
            });
            i += 1;
          }
          return as;
        }
      },
      center: {
        dep: [p.left1, p.left2, p.top1, p.top2],
        calc: function() {
          var as, i, length, x1, x2, y1, y2;
          length = calcLength(p);
          x1 = p.left1.gen();
          y1 = p.top1.gen();
          x2 = p.left2.gen();
          y2 = p.top2.gen();
          as = [];
          i = 0;
          while (i < length) {
            as.push({
              x: (x1(i) + x2(i)) / 2,
              y: (y1(i) + y2(i)) / 2
            });
            i += 1;
          }
          return as;
        }
      }
    };
    render = function() {
      var dur, len, m;
      len = calcLength(p);
      m = selectEnterExit(g, o, p, len);
      update_attr[o.myClass](m, p, true);
      if (panel.width.hasChanged() || panel.height.hasChanged()) {
        if (clip) {
          clip.attr('width', panel.width.get()).attr('height', panel.height.get());
        }
        dur = 0;
      } else {
        dur = o.duration.get();
      }
      m = reselectUpdate(g, o, dur);
      update_attr[o.myClass](m, p);
      return null;
    };
    listen = [panel.width, panel.height];
    _ref = listen_attr[o.myClass];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      listen.push(p[k]);
    }
    dvl.register({
      fn: render,
      listen: listen,
      name: 'lines_render'
    });
    return makeAnchors(anchors, o);
  };
  listen_attr.bars = ['left', 'top', 'width', 'height', 'fill', 'stroke'];
  update_attr.bars = function(m, p, prev) {
    var fill, gen, height, left, left_gen, stroke, top, top_gen, width;
    gen = prev ? 'genPrev' : 'gen';
    left = p.left;
    top = p.top;
    if (prev || left.hasChanged() || top.hasChanged()) {
      left_gen = left[gen]();
      top_gen = top[gen]();
      m.attr('transform', (function(i) {
        return "translate(" + (left_gen(i)) + "," + (top_gen(i)) + ")";
      }));
    }
    width = p.width;
    if (width && (prev || width.hasChanged())) {
      m.attr('width', width[gen]());
    }
    height = p.height;
    if (height && (prev || height.hasChanged())) {
      m.attr('height', height[gen]());
    }
    fill = p.fill;
    if (fill && (prev || fill.hasChanged())) {
      m.style('fill', fill[gen]());
    }
    stroke = p.stroke;
    if (stroke && (prev || stroke.hasChanged())) {
      m.style('stroke', stroke[gen]());
    }
    return null;
  };
  dvl.svg.bars = function(options) {
    var anchors, clip, g, k, listen, o, p, panel, render, _i, _len, _ref;
    o = processOptions(options, 'rect', 'bars');
    if (o.clip == null) {
      o.clip = true;
    }
    p = processProps(options.props);
    panel = options.panel;
    processDim4(p, panel.width, 'left', 'width', 'right', 'centerX');
    processDim4(p, panel.height, 'top', 'height', 'bottom', 'centerY');
    g = initGroup(panel, o);
    clip = initClip(panel, g, o);
    anchors = {
      center: {
        dep: [p.left, p.top, p.width, p.height],
        calc: function() {
          var as, h, i, length, w, x, y;
          length = calcLength(p);
          x = p.left.gen();
          y = p.top.gen();
          w = p.width.gen();
          h = p.height.gen();
          as = [];
          i = 0;
          while (i < length) {
            as.push({
              x: x(i) + w(i) / 2,
              y: y(i) + h(i) / 2
            });
            i += 1;
          }
          return as;
        }
      }
    };
    render = function() {
      var dimChange, dur, len, m;
      len = calcLength(p);
      if (len > 0) {
        m = selectEnterExit(g, o, p, len);
        update_attr[o.myClass](m, p, true);
        dimChange = panel.width.hasChanged() || panel.height.hasChanged();
        if (dimChange) {
          if (clip) {
            clip.attr('width', panel.width.get()).attr('height', panel.height.get());
          }
          dur = 0;
        } else {
          dur = o.duration.get();
        }
        m = reselectUpdate(g, o, dur);
        update_attr[o.myClass](m, p);
        g.style('display', null);
      } else {
        g.style('display', 'none');
      }
      return null;
    };
    listen = [panel.width, panel.height];
    _ref = listen_attr[o.myClass];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      listen.push(p[k]);
    }
    dvl.register({
      fn: render,
      listen: listen,
      name: 'bars_render'
    });
    return makeAnchors(anchors, o);
  };
  listen_attr.labels = ['left', 'top', 'baseline', 'align', 'text', 'color'];
  update_attr.labels = function(m, p, prev) {
    var align, angle, angle_gen, baseline, baseline_gen, color, gen, left, left_gen, top, top_gen;
    gen = prev ? 'genPrev' : 'gen';
    left = p.left;
    top = p.top;
    angle = p.angle;
    if (prev || left.hasChanged() || top.hasChanged() || (angle && angle.hasChanged())) {
      left_gen = left[gen]();
      top_gen = top[gen]();
      if (angle) {
        angle_gen = angle[gen]();
        m.attr('transform', (function(i) {
          return "translate(" + (left_gen(i)) + "," + (top_gen(i)) + ") rotate(" + (angle_gen(i)) + ")";
        }));
      } else {
        m.attr('transform', (function(i) {
          return "translate(" + (left_gen(i)) + "," + (top_gen(i)) + ")";
        }));
      }
    }
    baseline = p.baseline;
    if (baseline && (prev || baseline.hasChanged())) {
      baseline_gen = baseline[gen]();
      m.attr('dy', (function(i) {
        var pi;
        pi = baseline_gen(i);
        if (pi === 'top') {
          return '.71em';
        } else if (pi === 'middle') {
          return '.35em';
        } else {
          return null;
        }
      }));
    }
    align = p.align;
    if (align && (prev || align.hasChanged())) {
      m.attr('text-anchor', align[gen]());
    }
    color = p.color;
    if (color && (prev || color.hasChanged())) {
      m.style('fill', color[gen]());
    }
    return null;
  };
  dvl.svg.labels = function(options) {
    var anchors, clip, g, k, listen, o, p, panel, render, _i, _len, _ref;
    o = processOptions(options, 'text', 'labels');
    if (o.clip == null) {
      o.clip = false;
    }
    p = processProps(options.props);
    panel = options.panel;
    processDim2(p, panel.width, 'left', 'right');
    processDim2(p, panel.height, 'top', 'bottom');
    g = initGroup(panel, o);
    clip = initClip(panel, g, o);
    anchors = {};
    render = function() {
      var dur, len, m, text;
      len = calcLength(p);
      if (len > 0) {
        text = p.text.gen();
        m = selectEnterExit(g, o, p, len);
        update_attr[o.myClass](m, p, true);
        m.text(text);
        if (panel.width.hasChanged() || panel.height.hasChanged()) {
          if (clip) {
            clip.attr('width', panel.width.get()).attr('height', panel.height.get());
          }
          dur = 0;
        } else {
          dur = o.duration.get();
        }
        m = g.selectAll("" + o.mySvg + "." + o.myClass);
        if (p.text.hasChanged()) {
          m.text(text);
        }
        if (dur > 0) {
          m = m.transition().duration(dur);
        }
        update_attr[o.myClass](m, p);
        g.style('display', null);
      } else {
        g.style('display', 'none');
      }
      return null;
    };
    listen = [panel.width, panel.height];
    _ref = listen_attr[o.myClass];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      listen.push(p[k]);
    }
    dvl.register({
      fn: render,
      listen: listen,
      name: 'labels_render'
    });
    return makeAnchors(anchors, o);
  };
  listen_attr.dots = ['left', 'top', 'radius', 'fill', 'stroke'];
  update_attr.dots = function(m, p, prev) {
    var fill, gen, left, radius, stroke, top;
    gen = prev ? 'genPrev' : 'gen';
    left = p.left;
    if (left && (prev || left.hasChanged())) {
      m.attr('cx', left[gen]());
    }
    top = p.top;
    if (top && (prev || top.hasChanged())) {
      m.attr('cy', top[gen]());
    }
    radius = p.radius;
    if (radius && (prev || radius.hasChanged())) {
      m.attr('r', radius[gen]());
    }
    fill = p.fill;
    if (fill && (prev || fill.hasChanged())) {
      m.style('fill', fill[gen]());
    }
    stroke = p.stroke;
    if (stroke && (prev || stroke.hasChanged())) {
      m.style('stroke', stroke[gen]());
    }
    return null;
  };
  return dvl.svg.dots = function(options) {
    var anchors, clip, g, k, listen, o, p, panel, render, _i, _len, _ref;
    o = processOptions(options, 'circle', 'dots');
    if (o.clip == null) {
      o.clip = true;
    }
    p = processProps(options.props);
    panel = options.panel;
    processDim2(p, panel.width, 'left', 'right');
    processDim2(p, panel.height, 'top', 'bottom');
    g = initGroup(panel, o);
    clip = initClip(panel, g, o);
    anchors = {
      left: {
        dep: [p.left, p.top, p.radius],
        calc: function() {
          var as, i, length, r, x, y;
          length = calcLength(p);
          x = p.left.gen();
          y = p.top.gen();
          r = p.radius.gen();
          as = [];
          i = 0;
          while (i < length) {
            as.push({
              x: x(i) - r(i),
              y: y(i)
            });
            i += 1;
          }
          return as;
        }
      },
      right: {
        dep: [p.left, p.top, p.radius],
        calc: function() {
          var as, i, length, r, x, y;
          length = calcLength(p);
          x = p.left.gen();
          y = p.top.gen();
          r = p.radius.gen();
          as = [];
          i = 0;
          while (i < length) {
            as.push({
              x: x(i) + r(i),
              y: y(i)
            });
            i += 1;
          }
          return as;
        }
      },
      top: {
        dep: [p.left, p.top, p.radius],
        calc: function() {
          var as, i, length, r, x, y;
          length = calcLength(p);
          x = p.left.gen();
          y = p.top.gen();
          r = p.radius.gen();
          as = [];
          i = 0;
          while (i < length - 1) {
            as.push({
              x: x(i),
              y: y(i) - r(i)
            });
            i += 1;
          }
          return as;
        }
      },
      bottom: {
        dep: [p.left, p.top, p.radius],
        calc: function() {
          var as, i, length, r, x, y;
          length = calcLength(p);
          x = p.left.gen();
          y = p.top.gen();
          r = p.radius.gen();
          as = [];
          i = 0;
          while (i < length - 1) {
            as.push({
              x: x(i),
              y: y(i) + r(i)
            });
            i += 1;
          }
          return as;
        }
      }
    };
    render = function() {
      var dur, len, m;
      len = calcLength(p);
      m = selectEnterExit(g, o, p, len);
      update_attr[o.myClass](m, p, true);
      if (panel.width.hasChanged() || panel.height.hasChanged()) {
        if (clip) {
          clip.attr('width', panel.width.get()).attr('height', panel.height.get());
        }
        dur = 0;
      } else {
        dur = o.duration.get();
      }
      m = reselectUpdate(g, o, dur);
      update_attr[o.myClass](m, p);
      return null;
    };
    listen = [panel.width, panel.height];
    _ref = listen_attr[o.myClass];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      listen.push(p[k]);
    }
    dvl.register({
      fn: render,
      listen: listen,
      name: 'dots_renderer'
    });
    return makeAnchors(anchors, o);
  };
})();
dvl.html = {};
dvl.html.out = function(_arg) {
  var attr, data, format, hideInvalid, invalid, out, selector, style, text, updateHtml, what;
  selector = _arg.selector, data = _arg.data, format = _arg.format, invalid = _arg.invalid, hideInvalid = _arg.hideInvalid, attr = _arg.attr, style = _arg.style, text = _arg.text;
  if (!data) {
    throw 'must have data';
  }
  data = dvl.wrapConstIfNeeded(data);
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
        if (inv != null) {
          out(s, inv);
        }
        if (hideInvalid.get()) {
          d3.select(s).style('display', 'none');
        }
      }
    }
    return null;
  };
  dvl.register({
    fn: updateHtml,
    listen: [data, selector, format],
    name: 'html_out'
  });
  return null;
};
dvl.html.select = function(_arg) {
  var def, names, options, selChange, selectEl, selection, selector, values;
  selector = _arg.selector, values = _arg.values, names = _arg.names, def = _arg.def, selection = _arg.selection;
  if (!selector) {
    throw 'must have selector';
  }
  options = dvl.wrapConstIfNeeded(options);
  selection = dvl.wrapVarIfNeeded(selection, 'selection');
  values = dvl.wrapConstIfNeeded(values);
  names = dvl.wrapConstIfNeeded(names);
  selChange = function() {
    return selection.set(selectEl.node().value).notify();
  };
  selectEl = d3.select(selector).append('select').on('change', selChange);
  selectEl.selectAll('option').data(d3.range(values.len())).enter('option').attr('value', values.gen()).text(names.gen());
  selChange();
  return selection;
};
dvl.html.table = function(_arg) {
  var b, c, classStr, colClass, columns, h, headerColClass, headerTooltip, i, listen, makeTable, modes, newColumns, onHeaderClick, rowClassGen, rowLimit, sel, selector, showHeader, si, sort, sortIndicator, sortModes, sortOn, sortOnClick, sortOrder, t, tableLength, tc, th, thead, topHeader, visible, _i, _j, _len, _len2, _ref;
  selector = _arg.selector, classStr = _arg.classStr, rowClassGen = _arg.rowClassGen, visible = _arg.visible, columns = _arg.columns, showHeader = _arg.showHeader, sort = _arg.sort, onHeaderClick = _arg.onHeaderClick, headerTooltip = _arg.headerTooltip, rowLimit = _arg.rowLimit;
  if (dvl.knows(selector)) {
    throw 'selector has to be a plain string.';
  }
  if (dvl.knows(columns)) {
    throw 'columns has to be a plain array.';
  }
  if (dvl.knows(sort)) {
    throw 'sort has to be a plain object.';
  }
  visible = dvl.wrapConstIfNeeded(visible != null ? visible : true);
  showHeader = dvl.wrapConstIfNeeded(showHeader != null ? showHeader : true);
  onHeaderClick = dvl.wrapConstIfNeeded(onHeaderClick);
  headerTooltip = dvl.wrapConstIfNeeded(headerTooltip || null);
  rowLimit = dvl.wrapConstIfNeeded(rowLimit || null);
  sort = sort || {};
  sortOn = dvl.wrapVarIfNeeded(sort.on);
  sortOnClick = dvl.wrapConstIfNeeded(sort.autoOnClick != null ? sort.autoOnClick : true);
  sortModes = dvl.wrapConstIfNeeded(sort.modes || ['asc', 'desc', 'none']);
  modes = sortModes.get();
  sortOrder = dvl.wrapVarIfNeeded(sort.order || (modes.length > 0 ? modes[0] : 'none'));
  listen = [rowClassGen, visible, showHeader, headerTooltip, rowLimit, sortOn, sortModes, sortOrder];
  sortIndicator = dvl.wrapConstIfNeeded(sort.indicator);
  listen.push(sortIndicator);
  if (columns.length && columns[0].columns) {
    topHeader = [];
    newColumns = [];
    for (_i = 0, _len = columns.length; _i < _len; _i++) {
      tc = columns[_i];
      if (!(tc.columns && tc.columns.length !== 0)) {
        continue;
      }
      topHeader.push({
        title: dvl.wrapConstIfNeeded(tc.title),
        classStr: tc.classStr,
        span: tc.columns.length
      });
      listen.push(tc.title);
      _ref = tc.columns;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        c = _ref[_j];
        newColumns.push(c);
      }
    }
    columns = newColumns;
  }
  for (i in columns) {
    c = columns[i];
    c.title = dvl.wrapConstIfNeeded(c.title || '');
    c.sortable = dvl.wrapConstIfNeeded(c.sortable != null ? c.sortable : true);
    c.showIndicator = dvl.wrapConstIfNeeded(c.showIndicator != null ? c.showIndicator : true);
    c.reverseIndicator = dvl.wrapConstIfNeeded(c.reverseIndicator || false);
    c.headerTooltip = dvl.wrapConstIfNeeded(c.headerTooltip || null);
    listen.push(c.title, c.showIndicator, c.reverseIndicator, c.gen, c.sortGen, c.headerTooltip);
    c.uniquClass = 'column_' + i;
  }
  t = d3.select(selector).append('table');
  if (classStr) {
    t.attr('class', classStr);
  }
  colClass = function(c) {
    return (c.classStr || c.id) + ' ' + c.uniquClass + (c.sorted ? ' sorted' : '');
  };
  headerColClass = function(c) {
    return colClass(c) + (c.sortable.get() ? ' sortable' : ' unsortable');
  };
  thead = t.append('thead');
  if (topHeader) {
    th = thead.append('tr').attr('class', 'top_header');
  }
  h = thead.append('tr');
  b = t.append('tbody');
  if (topHeader) {
    th.selectAll('th').data(topHeader).enter('th').attr('class', function(d) {
      return d.classStr || null;
    }).attr('colspan', function(d) {
      return d.span;
    }).append('div').text(function(d) {
      return d.title.get();
    });
  }
  sel = h.selectAll('th').data(columns).enter('th').on('click', function(c) {
    var si;
    if (c.id == null) {
      return;
    }
    if (onHeaderClick.get()) {
      onHeaderClick.get()(c.id);
    }
    if (sortOnClick.get() && c.sortable.get()) {
      if (sortOn.get() === c.id) {
        modes = sortModes.get();
        si = modes.indexOf(sortOrder.get());
        return sortOrder.set(modes[(si + 1) % modes.length]).notify();
      } else {
        return sortOn.set(c.id).notify();
      }
    }
  });
  si = sortIndicator.get();
  sel.append('span');
  sel.append('img').attr('class', 'sort_indicator').style('display', function(c) {
    if (c.showIndicator.get() && si && si.none && c.sortable.get()) {
      return null;
    } else {
      return 'none';
    }
  }).attr('src', function(c) {
    if (c.showIndicator.get() && si && si.none) {
      return si.none;
    } else {
      return null;
    }
  });
  tableLength = function() {
    var c, l, length, _k, _len3;
    length = +Infinity;
    for (_k = 0, _len3 = columns.length; _k < _len3; _k++) {
      c = columns[_k];
      l = c.gen.len();
      if (l < length) {
        length = l;
      }
    }
    if (length === Infinity) {
      length = 1;
    }
    return length;
  };
  makeTable = function() {
    var c, col, dir, ent, gen, length, limit, numeric, r, ren, row, sortCol, sortFn, sortGen, sortOnId, _k, _l, _len3, _len4;
    length = tableLength();
    r = pv.range(length);
    if (visible.hasChanged()) {
      t.style('display', visible.get() ? null : 'none');
    }
    if (showHeader.hasChanged()) {
      thead.style('display', showHeader.get() ? null : 'none');
    }
    if (topHeader) {
      th.selectAll('th > div').data(topHeader).text(function(d) {
        return d.title.get();
      });
    }
    if (headerTooltip.hasChanged()) {
      h.attr('title', headerTooltip.get());
    }
    if (sort) {
      sortOnId = sortOn.get();
      sortCol = null;
      for (_k = 0, _len3 = columns.length; _k < _len3; _k++) {
        c = columns[_k];
        if (c.sorted = c.id === sortOnId) {
          sortCol = c;
          if (!sortCol.sortable.get()) {
            throw "sort on column marked unsortable (" + sortOnId + ")";
          }
        }
      }
      if (sortCol) {
        sortGen = (sortCol.sortGen || sortCol.gen).gen();
        numeric = sortGen && typeof (sortGen(0)) === 'number';
        dir = String(sortOrder.get()).toLowerCase();
        if (dir === 'desc') {
          sortFn = numeric ? (function(i, j) {
            return sortGen(j) - sortGen(i);
          }) : (function(i, j) {
            return sortGen(j).toLowerCase().localeCompare(sortGen(i).toLowerCase());
          });
          r.sort(sortFn);
        } else if (dir === 'asc') {
          sortFn = numeric ? (function(i, j) {
            return sortGen(i) - sortGen(j);
          }) : (function(i, j) {
            return sortGen(i).toLowerCase().localeCompare(sortGen(j).toLowerCase());
          });
          r.sort(sortFn);
        }
      }
      if (sortIndicator.get()) {
        h.selectAll('th').data(columns).select('img').style('display', function(c) {
          if (c.sortable.get() && c.showIndicator.get() && sortIndicator.get()[c === sortCol ? dir : 'none']) {
            return null;
          } else {
            return 'none';
          }
        }).attr('src', function(c) {
          var which;
          if (c.showIndicator.get()) {
            which = c === sortCol && dir !== 'none' ? c.reverseIndicator.get() ? (dir === 'asc' ? 'desc' : 'asc') : dir : 'none';
            return sortIndicator.get()[which];
          } else {
            return null;
          }
        });
      }
    }
    h.selectAll('th').data(columns).attr('class', headerColClass).attr('title', function(c) {
      return c.headerTooltip.get();
    }).select('span').text(function(c) {
      return c.title.get();
    });
    limit = rowLimit.get();
    if (limit != null) {
      r = r.splice(0, Math.max(0, limit));
    }
    sel = b.selectAll('tr').data(r);
    ent = sel.enter('tr');
    if (rowClassGen) {
      gen = rowClassGen.gen();
      ent.attr('class', gen);
      sel.attr('class', gen);
    }
    sel.exit().remove();
    sel = b.selectAll('tr');
    row = sel.selectAll('td').data(columns);
    row.enter('td').attr('class', colClass);
    row.attr('class', colClass);
    row.exit().remove();
    for (_l = 0, _len4 = columns.length; _l < _len4; _l++) {
      col = columns[_l];
      gen = col.gen.gen();
      ren = dvl.typeOf(col.renderer) === 'function' ? col.renderer : dvl.html.table.renderer[col.renderer || 'html'];
      ren(sel.select('td.' + col.uniquClass), gen, col.sorted);
    }
    return null;
  };
  dvl.register({
    fn: makeTable,
    listen: listen,
    name: 'table_maker'
  });
  return {
    sortOn: sortOn,
    sortOrder: sortOrder
  };
};
dvl.html.table.renderer = {
  text: function(col, dataFn) {
    col.text(dataFn);
    return null;
  },
  html: function(col, dataFn) {
    col.html(dataFn);
    return null;
  },
  aLink: function(_arg) {
    var linkGen, titleGen;
    linkGen = _arg.linkGen, titleGen = _arg.titleGen;
    return function(col, dataFn) {
      var config, sel;
      sel = col.selectAll('a').data(function(d) {
        return [d];
      });
      config = function(d) {
        d.attr('href', linkGen.gen()).text(dataFn);
        if (titleGen) {
          return d.attr('title', titleGen.gen());
        }
      };
      config(sel.enter('a'));
      config(sel);
      return null;
    };
  },
  spanLink: function(_arg) {
    var click, titleGen;
    click = _arg.click, titleGen = _arg.titleGen;
    return function(col, dataFn) {
      var config, sel;
      sel = col.selectAll('span').data(function(d) {
        return [d];
      });
      config = function(d) {
        d.html(dataFn);
        d.on('click', click);
        if (titleGen) {
          return d.attr('title', titleGen.gen());
        }
      };
      config(sel.enter('span').attr('class', 'span_link'));
      config(sel);
      return null;
    };
  },
  barDiv: function(col, dataFn) {
    var sel;
    sel = col.selectAll('div').data(function(d) {
      return [d];
    });
    sel.enter('div').attr('class', 'bar_div').style('width', (function(d) {
      return dataFn(d) + 'px';
    }));
    sel.style('width', (function(d) {
      return dataFn(d) + 'px';
    }));
    return null;
  },
  img: function(col, dataFn) {
    var sel;
    sel = col.selectAll('img').data(function(d) {
      return [d];
    });
    sel.enter('img').attr('src', dataFn);
    sel.attr('src', dataFn);
    return null;
  },
  svgSparkline: function(_arg) {
    var classStr, height, padding, width, x, y;
    classStr = _arg.classStr, width = _arg.width, height = _arg.height, x = _arg.x, y = _arg.y, padding = _arg.padding;
    return function(col, dataFn) {
      var line, make_sparks, svg;
      svg = col.selectAll('svg').data(function(i) {
        return [dataFn(i)];
      });
      line = function(d) {
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
      make_sparks = function(svg) {
        var points, sel;
        sel = svg.selectAll('path').data(function(d) {
          return [d];
        });
        sel.enter("svg:path").attr("class", "line").attr("d", line);
        sel.attr("d", line);
        points = svg.selectAll('circle').data(function(d) {
          var mmx, mmy, sx, sy;
          mmx = dvl.util.getMinMax(d, (function(d) {
            return d[x];
          }));
          mmy = dvl.util.getMinMax(d, (function(d) {
            return d[y];
          }));
          sx = d3.scale.linear().domain([mmx.min, mmx.max]).range([padding, width - padding]);
          sy = d3.scale.linear().domain([mmy.min, mmy.max]).range([height - padding, padding]);
          return [['top', sx(d[mmy.maxIdx][x]), sy(mmy.max)], ['bottom', sx(d[mmy.minIdx][x]), sy(mmy.min)], ['right', sx(mmx.max), sy(d[mmx.maxIdx][y])], ['left', sx(mmx.min), sy(d[mmx.minIdx][y])]];
        });
        points.enter("svg:circle").attr("r", 2).attr("class", function(d) {
          return d[0];
        }).attr("cx", function(d) {
          return d[1];
        }).attr("cy", function(d) {
          return d[2];
        });
        return points.attr("cx", function(d) {
          return d[1];
        }).attr("cy", function(d) {
          return d[2];
        });
      };
      make_sparks(svg);
      make_sparks(svg.enter('svg:svg').attr('class', classStr).attr('width', width).attr('height', height));
      return null;
    };
  }
};
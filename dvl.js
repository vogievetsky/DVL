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
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != 'function')
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
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
  if (!(typeof console != "undefined" && console !== null ? console.log : void 0)) {
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
  version: '0.69'
};
dvl.util = {};
dvl.util.uniq = function(array) {
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
};
dvl.util.flip = function(array) {
  var i, map;
  map = {};
  i = 0;
  while (i < array.length) {
    map[array[i]] = i;
    i++;
  }
  return map;
};
(function() {
  var array_ctor, bfsUpdate, bfsZero, changed, changed_more, constants, date_ctor, initRun, lastRun, levelPriorityQueue, list, nextObjId, regex_ctor, registerers, saveInitRun, uniqById, variables;
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
  initRun = false;
  constants = {};
  variables = {};
  dvl["const"] = function(value, name) {
    var gen, id, len, v;
    name || (name = 'obj');
    id = name + '_const' + nextObjId;
    v = {
      id: id,
      set: function() {
        return v;
      },
      setLazy: function() {
        return v;
      },
      get: function() {
        return value;
      },
      getPrev: function() {
        return value;
      },
      hasChanged: function() {
        return initRun;
      },
      resetChanged: function() {
        return null;
      },
      notify: function() {
        return null;
      },
      remove: function() {
        return null;
      }
    };
    if (dvl.typeOf(value) === 'array') {
      gen = function(i) {
        return value[i];
      };
      len = value.length;
      v.push = function(value) {
        return null;
      };
      v.shift = function() {
        return;
      };
    } else {
      gen = function() {
        return value;
      };
      len = Infinity;
    }
    v.gen = function() {
      return gen;
    };
    v.genPrev = function() {
      return gen;
    };
    v.len = function() {
      return len;
    };
    constants[id] = v;
    nextObjId += 1;
    return v;
  };
  dvl.def = function(value, name) {
    var changed, gen, genPrev, id, lazy, len, prev, resolveLazy, v;
    name || (name = 'obj');
    id = name + '_' + nextObjId;
    prev = null;
    changed = false;
    gen = void 0;
    genPrev = void 0;
    len = -1;
    lazy = null;
    resolveLazy = function() {
      var val;
      if (lazy) {
        val = lazy();
        if (value === val && dvl.typeOf(val) === "object") {
          throw "lazy return must be new object in " + id;
        }
        prev = val;
        value = val;
      }
      return null;
    };
    v = {
      id: id,
      listeners: [],
      changers: [],
      hasChanged: function() {
        return initRun || changed;
      },
      resetChanged: function() {
        changed = false;
        return null;
      },
      set: function(val) {
        if ((val != null) && value === val && dvl.typeOf(val) === "object") {
          throw "dvl.set: must be new object in " + id;
        }
        if (!changed) {
          prev = value;
        }
        value = val;
        gen = void 0;
        changed = true;
        return v;
      },
      setLazy: function(fn) {
        lazy = fn;
        changed = true;
        return v;
      },
      setGen: function(g, l) {
        if (g === null) {
          l = 0;
        } else {
          if (l === void 0) {
            l = Infinity;
          }
        }
        if (!changed) {
          genPrev = gen;
        }
        gen = g;
        len = l;
        changed = true;
        return v;
      },
      push: function(val) {
        value.push(val);
        changed = true;
        return null;
      },
      shift: function() {
        var val;
        val = value.shift();
        changed = true;
        return val;
      },
      get: function() {
        resolveLazy();
        return value;
      },
      getPrev: function() {
        resolveLazy();
        if (prev && changed) {
          return prev;
        } else {
          return value;
        }
      },
      gen: function() {
        if (gen !== void 0) {
          return gen;
        } else {
          if (dvl.typeOf(value) === 'array') {
            return function(i) {
              return value[i];
            };
          } else {
            return function() {
              return value;
            };
          }
        }
      },
      genPrev: function() {
        if (genPrev && changed) {
          return genPrev;
        } else {
          return v.gen();
        }
      },
      len: function() {
        if (len >= 0) {
          return len;
        } else {
          if (value != null) {
            if (dvl.typeOf(value) === 'array') {
              return value.length;
            } else {
              return Infinity;
            }
          } else {
            return 0;
          }
        }
      },
      notify: function() {
        return dvl.notify(v);
      },
      remove: function() {
        var k;
        if (v.listeners.length > 0) {
          throw "Cannot remove variable " + id + " because it has listeners.";
        }
        if (v.changers.length > 0) {
          throw "Cannot remove variable " + id + " because it has changers.";
        }
        delete variables[id];
        for (k in v) {
          delete v[k];
        }
        return null;
      }
    };
    variables[id] = v;
    nextObjId += 1;
    return v;
  };
  dvl.knows = function(v) {
    return v && v.id && (variables[v.id] !== void 0 || constants[v.id] !== void 0);
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
  registerers = [];
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
    var v, w, _i, _len, _ref;
    while (queue.length > 0) {
      v = queue.shift();
      _ref = v.updates;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        w = _ref[_i];
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
  dvl.register = function(options) {
    var change, ctx, fo, fun, id, l, listen, v, _i, _j, _k, _l, _len, _len2, _len3, _len4;
    ctx = options.ctx;
    fun = options.fn;
    if (typeof fun !== 'function') {
      throw 'fn must be a function';
    }
    for (_i = 0, _len = registerers.length; _i < _len; _i++) {
      l = registerers[_i];
      if (l.ctx === ctx && l.fun === fun) {
        throw 'Called twice';
      }
    }
    listen = uniqById(options.listen);
    change = uniqById(options.change);
    if (listen.length === 0 && change.length === 0) {
      return;
    }
    nextObjId += 1;
    id = (options.name || 'fun') + '_' + nextObjId;
    fo = {
      id: id,
      ctx: ctx,
      fun: fun,
      listen: listen,
      change: change,
      updates: [],
      level: 0,
      remove: function() {
        return dvl.removeFn(fun);
      }
    };
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
    for (_l = 0, _len4 = registerers.length; _l < _len4; _l++) {
      l = registerers[_l];
      if (dvl.intersectSize(change, l.listen) > 0) {
        fo.updates.push(l);
      }
      if (dvl.intersectSize(listen, l.change) > 0) {
        l.updates.push(fo);
        fo.level = Math.max(fo.level, l.level + 1);
      }
    }
    registerers.push(fo);
    bfsUpdate([fo]);
    initRun = true;
    if (!options.noRun) {
      fun.apply(ctx);
    }
    initRun = false;
    return fo;
  };
  dvl.removeFn = function(fn) {
    var found, l, newRegisterers, queue, v, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2;
    found = null;
    newRegisterers = [];
    for (_i = 0, _len = registerers.length; _i < _len; _i++) {
      l = registerers[_i];
      if (l.fun === fn) {
        found = l;
      } else {
        newRegisterers.push(l);
      }
    }
    if (!found) {
      return;
    }
    registerers = newRegisterers;
    bfsZero([found]);
    queue = [];
    for (_j = 0, _len2 = registerers.length; _j < _len2; _j++) {
      l = registerers[_j];
      if (dvl.intersectSize(l.change, found.listen) > 0) {
        queue.push(l);
        l.updates.splice(l.updates.indexOf(l), 1);
      }
    }
    _ref = found.change;
    for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
      v = _ref[_k];
      v.changers.splice(v.changers.indexOf(found), 1);
    }
    _ref2 = found.listen;
    for (_l = 0, _len4 = _ref2.length; _l < _len4; _l++) {
      v = _ref2[_l];
      v.listeners.splice(v.listeners.indexOf(found), 1);
    }
    bfsUpdate(queue);
    return null;
  };
  dvl.clearAll = function() {
    var k, l, v, _i, _len;
    for (_i = 0, _len = registerers.length; _i < _len; _i++) {
      l = registerers[_i];
      l.listen = l.change = l.updates = null;
    }
    for (k in variables) {
      v = variables[k];
      v.listeners = v.changers = null;
    }
    nextObjId = 1;
    initRun = false;
    constants = {};
    variables = {};
    registerers = [];
    return null;
  };
  list = null;
  changed = null;
  changed_more = null;
  lastRun = null;
  levelPriorityQueue = function() {
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
  };
  saveInitRun = null;
  dvl.notify = function() {
    var cmv, l, queue, v, vs, w, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _ref, _ref2, _results;
    if (!(arguments.length > 0)) {
      return;
    }
    if (!list) {
      lastRun = [];
      changed = [];
      saveInitRun = initRun;
      initRun = false;
    }
    vs = [];
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      v = arguments[_i];
      if (v.listeners && v.changers) {
        vs.push(v);
        changed.push(v);
        lastRun.push(v.id);
      }
    }
    if (list) {
      _results = [];
      for (_j = 0, _len2 = vs.length; _j < _len2; _j++) {
        v = vs[_j];
        if (__indexOf.call(list.change, v) < 0) {
          throw "Changed unregisterd object " + v.id;
        }
        _results.push(changed_more.push(v));
      }
      return _results;
    } else {
      for (_k = 0, _len3 = registerers.length; _k < _len3; _k++) {
        l = registerers[_k];
        l.visited = false;
      }
      queue = levelPriorityQueue();
      for (_l = 0, _len4 = vs.length; _l < _len4; _l++) {
        v = vs[_l];
        _ref = v.listeners;
        for (_m = 0, _len5 = _ref.length; _m < _len5; _m++) {
          l = _ref[_m];
          queue.push(l);
        }
      }
      while (queue.length() > 0) {
        list = queue.shift();
        if (list.visited) {
          continue;
        }
        list.visited = true;
        changed_more = [];
        lastRun.push(list.id);
        list.fun.apply(list.ctx);
        for (_n = 0, _len6 = changed_more.length; _n < _len6; _n++) {
          cmv = changed_more[_n];
          _ref2 = cmv.listeners;
          for (_o = 0, _len7 = _ref2.length; _o < _len7; _o++) {
            w = _ref2[_o];
            if (!w.visited) {
              queue.push(w);
            }
          }
        }
      }
      list = null;
      changed_more = null;
      for (_p = 0, _len8 = changed.length; _p < _len8; _p++) {
        v = changed[_p];
        v.resetChanged();
      }
      return initRun = saveInitRun;
    }
  };
  dvl.graphToDot = function(lastTrace) {
    var color, dot, execOrder, funName, id, l, level, levels, nameMap, pos, v, varName, w, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _name, _ref, _ref2;
    execOrder = {};
    if (lastTrace && lastRun) {
      for (pos in lastRun) {
        id = lastRun[pos];
        execOrder[id] = pos;
      }
    }
    nameMap = {};
    for (_i = 0, _len = registerers.length; _i < _len; _i++) {
      l = registerers[_i];
      funName = l.id + ' (' + l.level + ')';
      funName = '"' + funName + '"';
      nameMap[l.id] = funName;
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
    for (_j = 0, _len2 = registerers.length; _j < _len2; _j++) {
      l = registerers[_j];
      levels[_name = l.level] || (levels[_name] = []);
      levels[l.level].push(nameMap[l.id]);
      color = execOrder[l.id] ? 'red' : 'black';
      dot.push("  " + nameMap[l.id] + " [shape=box,color=" + color + "];");
      _ref = l.listen;
      for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
        v = _ref[_k];
        color = execOrder[v.id] && execOrder[l.id] ? 'red' : 'black';
        dot.push("  " + nameMap[v.id] + " -> " + nameMap[l.id] + " [color=" + color + "];");
      }
      _ref2 = l.change;
      for (_l = 0, _len4 = _ref2.length; _l < _len4; _l++) {
        w = _ref2[_l];
        color = execOrder[l.id] && execOrder[w.id] ? 'red' : 'black';
        dot.push("  " + nameMap[l.id] + " -> " + nameMap[w.id] + " [color=" + color + "];");
      }
    }
    for (_m = 0, _len5 = levels.length; _m < _len5; _m++) {
      level = levels[_m];
      dot.push('{ rank = same; ' + level.join('; ') + '; }');
    }
    dot.push('}');
    return dot.join('\n');
  };
  dvl.postGraph = function(file) {
    var g;
    file || (file = 'dvl_graph');
    g = dvl.graphToDot(false);
    jQuery.post('http://localhost:8124/' + file, g);
    return null;
  };
  return dvl.postLatest = function(file) {
    var g;
    file || (file = 'dvl_graph_latest');
    g = dvl.graphToDot(true);
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
dvl.identity = dvl["const"]((function(x) {
  return x;
}), 'identity');
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
dvl.index = dvl["const"]((function(x, i) {
  return i;
}), 'index_accessor');
dvl.findMinMax = function(array, acc) {
  var a, i, len, max, min;
  if (!acc) {
    acc = dvl.identity;
  }
  min = +Infinity;
  max = -Infinity;
  len = array.length;
  i = 0;
  while (i < len) {
    a = acc(array[i], i);
    if (a < min) {
      min = a;
    }
    if (max < a) {
      max = a;
    }
    i += 1;
  }
  return {
    min: min,
    max: max
  };
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
  allowNull != null ? allowNull : allowNull = true;
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
dvl.apply = function(options) {
  var allowNull, apply, args, dontGet, fn, invalid, ret;
  fn = dvl.wrapConstIfNeeded(options.fn);
  args = options.args;
  if (!args) {
    throw 'dvl.apply only makes scense with at least one argument';
  }
  if (dvl.typeOf(args) !== 'array') {
    args = [args];
  }
  options || (options = {});
  invalid = options.invalid != null ? options.invalid : null;
  allowNull = options.allowNull;
  dontGet = options.dontGet;
  ret = dvl.def(invalid, 'fun_return');
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
      send.push(dontGet ? a : v);
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
    name: 'apply'
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
    throw 'dvl.recorder: it does not make sense not to have data';
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
      throw 'dvl.json: it does not make sense to not have a url';
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
    var get, notify, _i, _len;
    if (waitForCount[q] === 0) {
      delete waitForCount[q];
      notify = [];
      for (_i = 0, _len = gets.length; _i < _len; _i++) {
        get = gets[_i];
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
    throw 'No size given to dvl.resizer';
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
    fw = ident;
    fh = ident;
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
  $(window).resize(onResize);
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
    var args, invalid, s, v, _i, _len;
    args = [string];
    invalid = false;
    for (_i = 0, _len = subs.length; _i < _len; _i++) {
      s = subs[_i];
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
    makeScaleFnSingle = function(d) {
      var isColor, rf, rt;
      isColor = typeof (rangeFrom.get()) === 'string';
      rf = rangeFrom.get();
      rt = rangeTo.get();
      if (!isColor) {
        if (rt > rf) {
          rf += padding;
        } else {
          rf -= padding;
        }
      }
      scaleRef.set(function() {
        return rf;
      });
      invertRef.set(function() {
        return d;
      });
      ticksRef.set([d]);
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
      var a, acc, d0, data, dn, dom, f, hasEnoughData, max, min, mm, singleData, t, _i, _len;
      hasEnoughData = false;
      singleData = null;
      min = +Infinity;
      max = -Infinity;
      for (_i = 0, _len = optDomain.length; _i < _len; _i++) {
        dom = optDomain[_i];
        if (dom.data) {
          data = dom.data.get();
          if (data !== null) {
            acc = dom.acc || dvl.identity;
            a = acc.get();
            if (data.length > 1) {
              hasEnoughData = true;
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
                mm = dvl.findMinMax(data, a);
                if (mm.min < min) {
                  min = mm.min;
                }
                if (max < mm.max) {
                  max = mm.max;
                }
              }
            } else if (data.length === 1) {
              singleData = a(data[0], 0);
            }
          }
        } else {
          f = dom.from.get();
          t = dom.to.get();
          if ((f != null) && (t != null)) {
            hasEnoughData = true;
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
      if (hasEnoughData) {
        if (domainFrom !== min || domainTo !== max) {
          domainFrom = min;
          domainTo = max;
          makeScaleFn();
        }
      } else if (singleData != null) {
        makeScaleFnSingle(singleData);
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
        listenData.push(dom.data);
        listenData.push(dom.acc);
      } else {
        listenData.push(dom.from);
        listenData.push(dom.to);
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
    if ((a != null) && (f != null) && (dObj != null)) {
      d = a(dObj);
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
          var cgen, gis, _i, _len;
          gis = [];
          for (_i = 0, _len = gens.length; _i < _len; _i++) {
            cgen = gens[_i];
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
  dvl.svg.mouse = function(panel) {
    var recorder, x, y;
    x = dvl.def(null, 'mouse_x');
    y = dvl.def(null, 'mouse_y');
    recorder = function() {
      var h, m, mx, my, w;
      m = d3.svg.mouse(panel.g.node());
      w = panel.width.get();
      h = panel.height.get();
      mx = m[0];
      my = m[1];
      if ((0 <= mx && mx <= w) && (0 <= my && my <= h)) {
        x.set(mx);
        y.set(my);
      } else {
        x.set(null);
        y.set(null);
      }
      return dvl.notify(x, y);
    };
    panel.g.on('mousemove', recorder).on('mouseout', recorder);
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
      len = calcLength(p) - 1;
      if (len > 0) {
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
    var a, d, inv, s;
    s = selector.get();
    a = format.get();
    d = data.get();
    if (s != null) {
      if ((a != null) && (d != null)) {
        out(s, a(d)).style('display', null);
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
dvl.html.table = function(_arg) {
  var b, c, classStr, colClass, columns, h, i, listen, makeTable, modes, newColumns, onHeaderClick, rowLimit, sel, selector, showHeader, si, sort, sortIndicator, sortModes, sortOn, sortOnClick, sortOrder, t, tableLength, tc, th, thead, topHeader, visible, _i, _j, _len, _len2, _ref;
  selector = _arg.selector, classStr = _arg.classStr, columns = _arg.columns, showHeader = _arg.showHeader, sort = _arg.sort, onHeaderClick = _arg.onHeaderClick, rowLimit = _arg.rowLimit;
  if (dvl.knows(selector)) {
    throw 'selector has to be a plain string.';
  }
  if (dvl.knows(columns)) {
    throw 'columns has to be a plain array.';
  }
  if (dvl.knows(sort)) {
    throw 'sort has to be a plain object.';
  }
  visible = dvl.wrapConstIfNeeded(typeof visible != "undefined" && visible !== null ? visible : true);
  showHeader = dvl.wrapConstIfNeeded(showHeader != null ? showHeader : true);
  onHeaderClick = dvl.wrapConstIfNeeded(onHeaderClick);
  rowLimit = dvl.wrapConstIfNeeded(rowLimit || null);
  sort = sort || {};
  sortOn = dvl.wrapVarIfNeeded(sort.on);
  sortOnClick = dvl.wrapConstIfNeeded(sort.autoOnClick != null ? sort.autoOnClick : true);
  sortModes = dvl.wrapConstIfNeeded(sort.modes || ['asc', 'desc', 'none']);
  modes = sortModes.get();
  sortOrder = dvl.wrapVarIfNeeded(sort.order || (modes.length > 0 ? modes[0] : 'none'));
  listen = [showHeader, sortOn, sortModes, sortOrder];
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
    listen.push(c.title, c.showIndicator, c.reverseIndicator, c.gen, c.sortGen);
    c.uniquClass = 'column_' + i;
  }
  t = d3.select(selector).append('table');
  if (classStr) {
    t.attr('class', classStr);
  }
  colClass = function(c) {
    return (c.classStr || c.id) + ' ' + c.uniquClass;
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
    }).text(function(d) {
      return d.title.get();
    });
  }
  sel = h.selectAll('th').data(columns).enter('th').attr('class', function(c) {
    return colClass(c) + (c.sortable.get() ? ' sortable' : ' unsortable');
  }).on('click', function(c) {
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
  sel.append('span').text(function(c) {
    return c.title.get();
  });
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
    var c, l, length, _i, _len;
    length = +Infinity;
    for (_i = 0, _len = columns.length; _i < _len; _i++) {
      c = columns[_i];
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
    var c, col, dir, gen, length, limit, numeric, r, ren, row, sortCol, sortFn, sortGen, sortOnId, _i, _j, _len, _len2;
    length = tableLength();
    r = pv.range(length);
    if (visible.hasChanged()) {
      t.style('display', visible.get() ? null : 'none');
    }
    if (showHeader.hasChanged()) {
      thead.style('display', showHeader.get() ? null : 'none');
    }
    if (topHeader) {
      th.selectAll('th').data(topHeader).text(function(d) {
        return d.title.get();
      });
    }
    h.selectAll('th').data(columns).select('span').text(function(c) {
      return c.title.get();
    });
    if (sort) {
      sortOnId = sortOn.get();
      sortCol = null;
      for (_i = 0, _len = columns.length; _i < _len; _i++) {
        c = columns[_i];
        if (c.id === sortOnId) {
          sortCol = c;
          if (!sortCol.sortable.get()) {
            throw "sort on column marked unsortable (" + sortOnId + ")";
          }
          break;
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
    limit = rowLimit.get();
    if (limit != null) {
      r = r.splice(0, Math.max(0, limit));
    }
    sel = b.selectAll('tr').data(r);
    sel.enter('tr');
    sel.exit().remove();
    sel = b.selectAll('tr');
    row = sel.selectAll('td').data(columns);
    row.enter('td').attr('class', colClass);
    row.exit().remove();
    for (_j = 0, _len2 = columns.length; _j < _len2; _j++) {
      col = columns[_j];
      gen = col.gen.gen();
      ren = dvl.typeOf(col.renderer) === 'function' ? col.renderer : dvl.html.table.renderer[col.renderer || 'html'];
      ren(sel.select('td.' + col.uniquClass), gen);
      /*
      if gen

        tds = b.selectAll('tr > td.' + col.uniquClass)

        if col.link and col.link.gen()
          links = tds.selectAll('a').data((d, i) -> [i])

          update = (o) ->
            o.attr('href', (i) -> col.link.gen()(r[i]))
            o.on('click', col.click) if col.click
            o.text((i) -> gen(r[i]))

          update(links.enter('a'))
          update(links)
        else
          tds.html((d, i) -> gen(r[i]))
      */
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
    var linkGen;
    linkGen = _arg.linkGen;
    return function(col, dataFn) {
      var sel;
      sel = col.selectAll('a').data(function(d) {
        return [d];
      });
      sel.enter('a').attr('href', linkGen.gen()).text(dataFn);
      sel.attr('href', linkGen.gen()).text(dataFn);
      return null;
    };
  },
  spanLink: function(_arg) {
    var clickFn;
    clickFn = _arg.clickFn;
    return function(col, dataFn) {
      var sel;
      sel = col.selectAll('span').data(function(d) {
        return [d];
      });
      sel.enter('span').on('click', clickFn).text(dataFn);
      sel.text(dataFn);
      return null;
    };
  },
  svgSparkline: function(_arg) {
    var classStr, height, padding, width, x, y;
    classStr = _arg.classStr, width = _arg.width, height = _arg.height, x = _arg.x, y = _arg.y, padding = _arg.padding;
    return function(col, dataFn) {
      var getMinMax, line, make_sparks, svg;
      getMinMax = function(input, attr) {
        var d, i, maxi, maxv, mini, minv, v, _len;
        minv = Infinity;
        mini = -1;
        maxv = -Infinity;
        maxi = -1;
        for (i = 0, _len = input.length; i < _len; i++) {
          d = input[i];
          v = d[attr];
          if (v < minv) {
            minv = v;
            mini = i;
          }
          if (maxv < v) {
            maxv = v;
            maxi = i;
          }
        }
        return {
          mini: mini,
          maxi: maxi,
          minv: minv,
          maxv: maxv
        };
      };
      svg = col.selectAll('svg').data(function(i) {
        return [dataFn(i)];
      });
      line = function(d) {
        var mmx, mmy, sx, sy;
        mmx = getMinMax(d, x);
        mmy = getMinMax(d, y);
        sx = d3.scale.linear().domain([mmx.minv, mmx.maxv]).range([padding, width - padding]);
        sy = d3.scale.linear().domain([mmy.minv, mmy.maxv]).range([height - padding, padding]);
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
          mmx = getMinMax(d, x);
          mmy = getMinMax(d, y);
          sx = d3.scale.linear().domain([mmx.minv, mmx.maxv]).range([padding, width - padding]);
          sy = d3.scale.linear().domain([mmy.minv, mmy.maxv]).range([height - padding, padding]);
          return [['top', sx(d[mmy.maxi][x]), sy(mmy.maxv)], ['bottom', sx(d[mmy.mini][x]), sy(mmy.minv)], ['right', sx(mmx.maxv), sy(d[mmx.maxi][y])], ['left', sx(mmx.minv), sy(d[mmx.mini][y])]];
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
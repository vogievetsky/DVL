tests.push({
  name: "Add listen and run",
  test: function(debug, first, callback) {
    var ok = true;
    
    var max = dvl.def(null, "min");
    
    var listens = []
    var fo = dvl.register({
      name: 'fo',
      fn: function() {
        var m = Math.max.apply(null, listens.map(function(d) { return d.get(); }));
        max.set(m).notify();
      },
      listen: listens,
      change: [max],
      force: true
    });
    if (max.get() !== -Infinity) {
      ok = false;
      debug("Bad initial run (" + max.get() + ")");
    }

    var param1 = dvl.def(0, "param1");
    listens.push(param1);
    fo.addListen(param1);
    if (max.get() !== 0) {
      ok = false;
      debug("No run on param1 add (" + max.get() + ")");
    }
    
    param1.set(1).notify();
    if (max.get() !== 1) {
      ok = false;
      debug("No run on param1 update (" + max.get() + ")");
    }
    
    var param2 = dvl.const(2);
    listens.push(param2);
    fo.addListen(param2);
    if (max.get() !== 2) {
      ok = false;
      debug("No run on param2 (const) add (" + max.get() + ")");
    }
            
    callback(ok);
  }
});
tests.push({
  name: "Add listen and run change",
  test: function(debug, first, callback) {
    var ok = true;
    
    var join = dvl.def('', 'join');
    
    var listens = [];
    var fo = dvl.register({
      name: 'fo',
      fn: function() {
        var j = listens
          .filter(function(d) { return d.hasChanged(); })
          .map(function(d) { return d.get(); })
          .join(',');
        join.set(j).notify();
      },
      listen: listens,
      change: [join],
      force: true
    });
    if (join.get() !== '') {
      ok = false;
      debug("Bad initial run (" + join.get() + ")");
    }

    var param1 = dvl.def('A', "param1");
    listens.push(param1);
    fo.addListen(param1);
    if (join.get() !== 'A') {
      ok = false;
      debug("No run on param1 add (" + join.get() + ")");
    }
    
    param1.set('A1').notify();
    if (join.get() !== 'A1') {
      ok = false;
      debug("No run on param1 update (" + join.get() + ")");
    }
    
    var param2 = dvl.const('B');
    listens.push(param2);
    fo.addListen(param2);
    if (join.get() !== 'B') {
      ok = false;
      debug("No run on param2 (const) add (" + join.get() + ")");
    }
            
    callback(ok);
  }
});
tests.push({
  name: "On register change inputs",
  test: function(debug, first) {
    var ok = true;
    
    var join = dvl.def('', 'join');
    
    var listens = [
      dvl.def('A', 'param1'),
      dvl.const('B', 'param2'),
      dvl.def('C', 'param3'),
      dvl.const('D', 'param4'),
      dvl.def('E', 'param5'),
    ];
    
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
    if (join.get() !== 'A,B,C,D,E') {
      ok = false;
      debug("Bad initial run (" + join.get() + ")");
    }

    var triger = dvl.def(0);
    dvl.register({
      name: 'new_register',
      fn: function() {
        listens[0].set('A1');
        listens[4].set('E1');
        
        dvl.notify(listens[0], listens[4]);
      },
      listen: [triger],
      change: [listens[0], listens[4]]
    });
    if (join.get() !== 'A1,E1') {
      ok = false;
      debug("Bad register run (" + join.get() + ")");
    }
    
    triger.notify();
    if (join.get() !== 'A1,E1') {
      ok = false;
      debug("Bad triger run (" + join.get() + ")");
    }
      
    return ok;
  }
});
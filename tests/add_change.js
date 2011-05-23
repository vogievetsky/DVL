tests.push({
  name: "Add change",
  test: function(debug, first) {
    var ok = true;
    
    var a = dvl.def(0, "a");
    var b = dvl.def(0, "b");
    var c = dvl.def(0, "c");
    var d = dvl.def(0, "d");
    var e = dvl.def(0, "e");
    var f = dvl.def(0, "f");
    
    var flags = 0;
    
    // 1
    var fo1 = dvl.register({
      name: 'fo1',
      fn: function() {
        flags += 1;
        dvl.notify(c, d);
      },
      listen: [a, b],
      change: [c, d]
    });
    
    // 10
    var fo2 = dvl.register({
      name: 'fo2',
      fn: function() {
        flags += 10;
        dvl.notify(d, e);
      },
      listen: [a, b],
      change: [d, e]
    });

    // 100
    var fo3_notify = [f];
    var fo3 = dvl.register({
      name: 'fo3',
      fn: function() {
        flags += 100;
        dvl.notify.apply(null, fo3_notify);
      },
      listen: [c, d, e],
      change: [f]
    });
    
    // 1000
    var fo4 = dvl.register({
      name: 'fo4',
      fn: function() {
        flags += 1000;
        dvl.notify(f);
      },
      listen: [c, e],
      change: [f]
    });
 
    // 10000
    var fo5 = dvl.register({
      name: 'fo5',
      fn: function() {
        flags += 10000;
      },
      listen: [f]
    });
   
    if (flags != 11111) {
      ok = false;
      debug("Bad setup.") 
    }
    
    ///////////////////////////////////////
    
    var g = dvl.def(0, "g");
    dvl.register({
      name: 'fo_new',
      fn: function() {
        flags += 100000;
      },
      listen: [g]
    });
    
    flags = 0;
    fo3.addChange(g);
    fo3_notify.push(g);
    
    dvl.notify(a, b);
    if (flags != 111111) {
      ok = false;
      debug("Bad [a,b] notify. (" + flags + ")") 
    }
    
    ///////////////////////////////////////
            
    return ok;
  }
});
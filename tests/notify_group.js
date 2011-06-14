tests.push({
  name: "Group notifys on register",
  test: function(debug, first) {
    var ok = true;
    
    var count = 0;
    
    var a = dvl.def('a', 'a');
    var b = dvl.def('b', 'b');
    
    dvl.register({
      fn: function() { count++; },
      listen: [a,b]
    });
    if (count !== 1) {
      ok = false;
      debug("Bad initial run (" + count + ")");
    }
    
    count = 0;
    dvl.register({
      fn: function() {
        a.set('a1').notify();
        b.set('b1').notify();
      },
      change: [a,b]
    });
    if (count !== 1) {
      ok = false;
      debug("Bad notify run (" + count + ")");
    }
    
    try {
      dvl.register({
        fn: function() {
          b.set('b2').notify();
        },
        change: [a]
      });
      
      ok = false
      debug("Notified object outside of registered on first run.");
    } catch (e) {
      // this is what we expect
    }

    return ok;
  }
});
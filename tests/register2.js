tests.push({
  name: "Advanced registering",
  test: function(debug, first, callback) {
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
    var fo3 = dvl.register({
      name: 'fo3',
      fn: function() {
        flags += 100;
        dvl.notify(f);
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
    
    flags = 0;
    dvl.notify(a, b);
    if (flags != 11111) {
      ok = false;
      debug("Bad [a,b] notify.") 
    }
    
    ///////////////////////////////////////
    
    flags = 0;
    dvl.notify(a);
    if (flags != 11111) {
      ok = false;
      debug("Bad [a] notify.") 
    }
     
    ///////////////////////////////////////
    
    flags = 0;
    dvl.notify(b);
    if (flags != 11111) {
      ok = false;
      debug("Bad [b] notify.") 
    }

    ///////////////////////////////////////

    flags = 0;
    dvl.notify(c);
    if (flags != 11100) {
      ok = false;
      debug("Bad [c] notify.") 
    }  

    ///////////////////////////////////////

    flags = 0;
    dvl.notify(d);
    if (flags != 10100) {
      ok = false;
      debug("Bad [d] notify.") 
    }  

    ///////////////////////////////////////

    flags = 0;
    dvl.notify(e);
    if (flags != 11100) {
      ok = false;
      debug("Bad [e] notify.") 
    }

    ///////////////////////////////////////

    flags = 0;
    dvl.notify(f);
    if (flags != 10000) {
      ok = false;
      debug("Bad [f] notify.") 
    }

    ///////////////////////////////////////
    
    flags = 0;
    dvl.notify(a,b,c,d,e,f);
    if (flags != 11111) {
      ok = false;
      debug("Bad [a,b,c,d,e,f] notify.") 
    }
                   
    ///////////////////////////////////////
            
    callback(ok);
  }
});
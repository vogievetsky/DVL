var tests = [
{
  name: "Basic registering",
  test: function(debug) {
    var changeMe = dvl.def(0, "change_me");
    
    var called = 0;
    var listener = function() {
      called++;
    }
    
    dvl.register({
      fn: listener,
      listen: [changeMe],
      name: "listener"
    });
    
    changeMe.set(1).notify();
    
    return called == 2;
  }
},
{
  name: "Advanced registering",
  test: function(debug) {
    var ok = true;
    
    var a = dvl.def(0, "a");
    var b = dvl.def(0, "b");
    var c = dvl.def(0, "c");
    var d = dvl.def(0, "d");
    var e = dvl.def(0, "e");
    var f = dvl.def(0, "f");
    
    var flags = 0;
    
    // 1
    dvl.register({
      fn: function() {
        flags += 1;
        dvl.notify(c, d);
      },
      listen: [a, b],
      change: [c, d]
    });
    
    // 10
    dvl.register({
      fn: function() {
        flags += 10;
        dvl.notify(d, e);
      },
      listen: [a, b],
      change: [d, e]
    });

    // 100
    dvl.register({
      fn: function() {
        flags += 100;
        dvl.notify(f);
      },
      listen: [c, d, e],
      change: [f]
    });
    
    // 1000
    dvl.register({
      fn: function() {
        flags += 1000;
        dvl.notify(f);
      },
      listen: [c, e],
      change: [f]
    });
 
    // 10000
    dvl.register({
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
            
    return ok;
  }
},
{
  name: "Basic unregistering",
  test: function(debug) {
    var changeMe = dvl.def(0, "change_me");
    
    var called = 0;
    var listener = function() {
      called++;
    }
    
    dvl.register({
      fn: listener,
      listen: [changeMe],
      name: "listener"
    });
    
    dvl.removeFn(listener);
    
    //dvl.postGraph();
    
    changeMe.set(1).notify();
    
    return called == 1;
  }
},
{
  name: "Advanced unregistering",
  test: function(debug) {
    var ok = true;
    
    var a = dvl.def(0, "a");
    var b = dvl.def(0, "b");
    var c = dvl.def(0, "c");
    var d = dvl.def(0, "d");
    var e = dvl.def(0, "e");
    var f = dvl.def(0, "f");
    
    var flags = 0;
    
    // 1
    var fn_1 = dvl.register({
      fn: function() {
        flags += 1;
        dvl.notify(c, d);
      },
      listen: [a, b],
      change: [c, d]
    });
    
    // 10
    var fn_10 = dvl.register({
      fn: function() {
        flags += 10;
        dvl.notify(d, e);
      },
      listen: [a, b],
      change: [d, e]
    });

    // 100
    var fn_100 = dvl.register({
      fn: function() {
        flags += 100;
        dvl.notify(f);
      },
      listen: [c, d, e],
      change: [f]
    });
    
    // 1000
    var fn_1000 = dvl.register({
      fn: function() {
        flags += 1000;
        dvl.notify(f);
      },
      listen: [c, e],
      change: [f]
    });
 
    // 10000
    var fn_10000 = dvl.register({
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
      debug("Bad [a,b] notify 1.") 
    }
                   
    ///////////////////////////////////////
    
    fn_100.remove();
    fn_1000.remove();
    
    flags = 0;
    dvl.notify(a, b);
    if (flags != 11) {
      ok = false;
      debug("Bad [a,b] notify 2.") 
    }
                   
    ///////////////////////////////////////
    
    flags = 0;
    dvl.notify(f);
    if (flags != 10000) {
      ok = false;
      debug("Bad [f] notify.") 
    }
                   
    ///////////////////////////////////////
    
    fn_10.remove();
    
    flags = 0;
    dvl.notify(a, b);
    if (flags != 1) {
      ok = false;
      debug("Bad [a,b] notify 3.") 
    }    
    
    ///////////////////////////////////////
    
    return ok;
  }
}
];

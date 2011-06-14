tests.push({
  name: "Cicular registering",
  test: function(debug) {
    
    var a = dvl.def(null, 'a');
    var b = dvl.def(null, 'b');
    
    dvl.register({
      fn: function() { "whatever" },
      listen: [a],
      change: [b]
    });
    
    var failed = true;
    try {
      dvl.register({
        fn: function() { "whatever" },
        listen: [b],
        change: [a]
      });
    } catch (e) {  
      if (String(e).indexOf('circular') !== -1) {
        failed = false;
      }
    }
    
    return !failed;
  }
});
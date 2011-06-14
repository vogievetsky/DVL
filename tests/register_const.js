tests.push({
  name: "Constant registering",
  test: function(debug, first, callback) {
    var a = dvl.const(0, "a");
    
    var called = 0;
    var listener = function() {
      called++;
    }
    
    dvl.register({
      fn: listener,
      listen: [a],
      name: "listener"
    });
    
    a.set(1).notify();
    
    callback(called == 1);
  }
});
tests.push({
  name: "Basic registering",
  test: function(debug, first, callback) {
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
    
    callback(called === 2);
  }
});
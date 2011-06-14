tests.push({
  name: "Basic unregistering",
  test: function(debug, first, callback) {
    var changeMe = dvl.def(0, "change_me");
    
    var called = 0;

    var fo = dvl.register({
      fn: function() {
        called++;
      },
      listen: [changeMe],
      name: "listener"
    });
    
    fo.remove();
    
    //dvl.postGraph();
    
    changeMe.set(1).notify();
    
    callback(called === 1);
  }
});
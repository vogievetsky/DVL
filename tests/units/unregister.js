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
}
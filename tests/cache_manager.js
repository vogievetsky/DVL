tests.push({
  name: "Cache Manager",
  test: function(debug, first, callback) {
    var ok = true;
    
    var max = dvl.def(10);
    var timeout = dvl.def(100);
    
    var c = dvl.json.cacheManager({max:max, timeout:timeout});
    
    var dataA = d3.range(5).map(function(d) { return 'a'+d; }); 
    
    for (var i=0; i < dataA.length; i++) {
      c.store(dataA[i], dataA[i])
    }
    
    for (var i=0; i < dataA.length; i++) {
      if(!c.has(dataA[i])) {
        ok = false;
        debug('no data A')
      }
    }
    
    setTimeout((function() {
      var dataB = d3.range(10).map(function(d) { return 'b'+d; }); 
    
      for (var i=0; i < dataB.length; i++) {
        c.store(dataB[i], dataB[i])
      }
    
      for (var i=0; i < dataB.length; i++) {
        if(!c.has(dataB[i])) {
          ok = false;
          debug('no data B')
        }
      }
      
      for (var i=0; i < dataA.length; i++) {
        if(c.has(dataA[i])) {
          ok = false;
          debug('has data A')
        }
      }
            
      setTimeout((function() {
        var dataB = d3.range(10).map(function(d) { return 'b'+d; }); 

        for (var i=0; i < dataB.length; i++) {
          if(c.has(dataB[i])) {
            ok = false;
            debug('has data B')
          }
        }

        callback(ok);
      }), 200);
    }), 5);
  }
});
var dvlChain = function (f, h) {
  console.log("entering");
    var out;
    f = dvl.wrap(f);
    h = dvl.wrap(h);
    out = dvl().name('chain');
    console.log("I'm here.");
    dvl.register({
      listen: [f, h],
      change: [out],
      fn: function() {
        var _f, _h;
        _f = f.value();
        _h = h.value();
        if (_f && _h) {
          out.value(function(x) {
            return _h(_f(x));
          });
        } else {
          out.value(null);
        }
      }
    });
    return out;
  };

var a = dvl(5);
var funB = function(b) { return b * 2; }

var chained = dvlChain(a, funB);

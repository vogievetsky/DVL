// Generated by CoffeeScript 1.6.2
var d3, dvl, miscModule;

d3 = require('d3');

dvl = require('./core');

miscModule = {};

miscModule.mouse = function(element, out) {
  var height, recorder, width;

  element = dvl.wrap(element);
  width = dvl.wrap(width);
  height = dvl.wrap(height);
  out = dvl.wrapVar(out, 'mouse');
  recorder = function() {
    var mouse, _element;

    _element = element.value();
    mouse = _element && d3.event ? d3.mouse(_element.node()) : null;
    out.value(mouse);
  };
  element.value().on('mousemove', recorder).on('mouseout', recorder);
  dvl.register({
    name: 'mouse_recorder',
    listen: element,
    change: out,
    fn: recorder
  });
  return out;
};

miscModule.delay = function(data, time) {
  var out, timeoutFn, timer;

  if (time == null) {
    time = 1;
  }
  data = dvl.wrap(data);
  time = dvl.wrap(time);
  timer = null;
  out = dvl();
  timeoutFn = function() {
    out.value(data.value());
    timer = null;
  };
  dvl.register({
    listen: [data, time],
    change: [out],
    name: 'timeout',
    fn: function() {
      var t;

      if (timer) {
        clearTimeout(timer);
      }
      timer = null;
      if (time.value() != null) {
        t = Math.max(0, time.value());
        timer = setTimeout(timeoutFn, t);
      }
    }
  });
  return out;
};

module.exports = miscModule;

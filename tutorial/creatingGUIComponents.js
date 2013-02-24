var data = dvl([2, 6, 8, 3, 2]);

setInterval(function() {
  var _data = data.get();
  _data.shift()
  _data.push(Math.round(Math.random() * 9 + 1))
  _data;
  data.set(_data).notify();
}, 1000);

var xFn = dvl(function(d, i) { return i * 50 });

var svg = d3.select('body').append('svg');

dvl.bind({
  parent: svg,
  self: 'rect.myclass',
  data: data,
  join: String,
  attr: {
    x: dvl.op.add(xFn, 100),
    y: 0,
    height: function(d) { return d * 10 },
    width: 20
  }
});

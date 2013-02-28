var data = dvl([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).compare(false);
var barSpacing = 10;
var barWidth = 50;

setInterval(function() {
  _data = data.value();
  for (var i = 0; i < data.value().length; i++) {
    if (Math.random() > 0.5)
    _data[i] = _data[i] + 1;
  }
  data.value(_data);
}, 200);


/*
dvl.bind({
  parent: d3.select("#realTimeBarChart"),
  self: "div.bar",
  data: coords,
  text: String,
  style: {height: function (x) { return x + 50 + "px"; },
      left: function (x, i) { return (barWidth + barSpacing) * i + "px"; },
      width: barWidth
  }
});
*/

var width = 400;
var height = width;

var svg = dvl.bind({
  parent: d3.select('body'),
  self: 'svg',
  attr: {
    width: width,
    height: height
  }
});

var sy = dvl.apply(
    [data, height],
    function(data, height) {
      if (!data.length) return null
      return d3.scale.linear()
        .domain([d3.min(data), d3.max(data)])
        .range([height, 0])
    }
  );




/*

	var margin = { top: 30, bottom: 70, left: 30, right: 70 };

  var width = 800;
  var height = 500;
  var innerWidth = dvl.op.sub(width, margin.left, margin.right);
  var innerHeight = dvl.op.sub(height, margin.top, margin.bottom);

  var vis = dvl.bind({
    parent: svg,
    self: 'g.vis',
    attr: {
      'clip-path': clipPathId
    }
  });

  var visTicks = dvl.bind({
    parent: svg,
    self: 'g.ticks'
  });

  var sx = dvl.apply(
    [data, innerWidth, getX],
    function(data, width, fn) {
      if (!data.length) return null
      return d3.time.scale()
        .domain([fn(data[0]), fn(data[data.length-1])])
        .range([0, width])
    }
  );
  var sxTicks = sx.apply(function(d) { return d.ticks(10) });
  var sxTickFormat = sx.apply(function(d) { return d.tickFormat(10) });

  var sy = dvl.apply(
    [data, innerHeight, getY],
    function(data, height, fn) {
      if (!data.length) return null
      return d3.scale.linear()
        .domain([d3.min(data, fn), d3.max(data, fn)])
        .range([height, 0])
    }
  );
  var syTicks = sy.apply(function(d) { return d.ticks(10) });
  var syTickFormat = sy.apply(function(d) { return d.tickFormat(10) });

  dvl.bind({
    parent: vis,
    self: 'line.x-ticks',
    data: sxTicks,
    join: String,
    attr: {
      x1: sx,
      y1: 0,
      x2: sx,
      y2: innerHeight
    }
  });

  dvl.bind({
    parent: visTicks,
    self: 'text.x-ticks',
    data: sxTicks,
    join: String,
    attr: {
      x: sx,
      y: innerHeight,
      dy: '1.2em'
    },
    text: sxTickFormat
  });

  dvl.bind({
    parent: vis,
    self: 'line.y-ticks',
    data: syTicks,
    join: String,
    attr: {
      x1: 0,
      y1: sy,
      x2: innerWidth,
      y2: sy
    }
  });

  dvl.bind({
    parent: visTicks,
    self: 'text.y-ticks',
    data: syTicks,
    join: String,
    attr: {
      x: innerWidth,
      y: sy,
      dx: '4px',
      dy: '.35em'
    },
    text: syTickFormat
  });

  var lineFn = dvl.apply(
    [sx, getX, sy, getY],
    function(sx, ax, sy, ay) {
      return d3.svg.line()
        .x(function(d) { return sx(ax(d)); })
        .y(function(d) { return sy(ay(d)); })
    }
  );

  dvl.bind({
    parent: vis,
    self: 'path',
    data: dvl.op.list(data),
    attr: {
      d: lineFn
    }
  });
  */
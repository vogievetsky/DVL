function scatter(args) {
  var parent = args.parent;
  var width = args.width;
  var height = args.height;
  var data = args.data;
  var metricX = dvl.wrap(args.metricX);
  var metricY = dvl.wrap(args.metricY);
  var selData = dvl.wrapVar(args.selData);
  var selHolder = dvl.wrapVar(args.selHolder);
  var me = {};
  var duration = 200;
  var selDuration = dvl(duration, 'sel_duration');

  var mySelection = dvl.apply({
    args: selHolder,
    fn: function(_selHolder) { return _selHolder === me; },
    invalid: false
  });

  var getX = dvl.acc(metricX);
  var getY = dvl.acc(metricY);

  var margin = { top: 15, bottom: 30, left: 70, right: 10 };

  var innerWidth  = dvl.op.sub(width, margin.left, margin.right);
  var innerHeight = dvl.op.sub(height, margin.top, margin.bottom);

  var sx = dvl.apply({
    args: [innerWidth, data, getX],
    fn: function(w, data, fn) {
      var min = d3.min(data, fn);
      var max = d3.max(data, fn);
      return d3.scale.linear().domain([min, max]).range([0, w])
    }
  });

  var sy = dvl.apply({
    args: [innerHeight, data, getY],
    fn: function(h, data, fn) {
      var min = d3.min(data, fn);
      var max = d3.max(data, fn);
      return d3.scale.linear().domain([min, max]).range([h, 0])
    }
  });

  var svg = dvl.bindSingle({
    parent: parent,
    self: 'svg.scatter',
    attr: {
      width:  width,
      height: height
    }
  });

  var cont = dvl.bindSingle({
    parent: svg,
    self: 'g',
    attr: {
      transform: 'translate(' + margin.left + ',' + margin.top + ')'
    }
  });

  var startDataX = null;
  var startDataY = null;
  var panelNode = cont.get().node();
  function updateRect() {
    if (startDataX == null || startDataY == null) return;

    var mouse = d3.svg.mouse(panelNode);
    var mX = sx.value().invert(mouse[0]);
    var mY = sy.value().invert(mouse[1]);

    selStartX.set(Math.min(startDataX, mX));
    selStartY.set(Math.min(startDataY, mY));
    selEndX.set(Math.max(startDataX, mX));
    selEndY.set(Math.max(startDataY, mY));

    dvl.notify(selStartX, selStartY, selEndX, selEndY);
  }

  dvl.bindSingle({
    parent: cont,
    self: 'rect.background',
    attr: {
      width:  innerWidth,
      height: innerHeight
    },
    on: {
      mousedown: function() {
        var mouse = d3.svg.mouse(panelNode);
        startDataX = sx.value().invert(mouse[0]);
        startDataY = sy.value().invert(mouse[1]);

        selStartX.set(null);
        selStartY.set(null);
        selEndX.set(null);
        selEndY.set(null);
        selData.set(null);
        selDuration.set(0).notify();

        dvl.notify(selStartX, selStartY, selEndX, selEndY, selData);
      },
      mousemove: function() {
        if (startDataX == null || startDataY == null) return;
        selHolder.set(me).notify();
        updateRect();
      },
      mouseup: function() {
        if (startDataX == null || startDataY == null) return;
        updateRect();
        startDataX = null;
        startDataY = null;
        selDuration.set(duration).notify();
      }
    }
  });

  var selStartX = dvl().name('sel_start_x');
  var selStartY = dvl().name('sel_start_y');
  var selEndX = dvl().name('sel_end_x');
  var selEndY = dvl().name('sel_end_y');

  dvl.register({
    listen: [mySelection, data, selStartX, selStartY, selEndX, selEndY, metricX, metricY],
    change: [selData],
    fn: function() {
      if (!mySelection.get()) return;

      var _data = data.get();
      var _selStartX = selStartX.get();
      var _selStartY = selStartY.get();
      var _selEndX = selEndX.get();
      var _selEndY = selEndY.get();
      var _metricX = metricX.get();
      var _metricY = metricY.get();

      if (_data == null || _selStartX == null || _selStartY == null || _selEndX == null || _selEndY == null || _metricX == null || _metricY == null) {
        selData.set(null).notify();
      } else {
        var _selData = [];
        for (var i = 0; i < _data.length; i++) {
          var d = _data[i];
          var dx = d[_metricX];
          var dy = d[_metricY];
          if (_selStartX <= dx && dx <= _selEndX && _selStartY <= dy && dy <= _selEndY) {
            _selData.push(d);
          }
        };
        selData.set(_selData).notify();
      }
    }
  });

  var tickGroup = dvl.bindSingle({ parent: cont, self: 'g.ticks' });
  var xTicks = dvl.apply(sx, function(s) { return s.ticks(7); });
  var yTicks = dvl.apply(sy, function(s) { return s.ticks(7); });

  dvl.bind({
    parent: tickGroup,
    self: 'line.vertical',
    data: xTicks,
    join: dvl.identity,
    attr: {
      x1: sx,
      y1: 0,
      x2: sx,
      y2: innerHeight
    }
  });

  dvl.bind({
    parent: tickGroup,
    self: 'text.x',
    data: xTicks,
    join: dvl.identity,
    attr: {
      x: sx,
      y: innerHeight,
      dy: '1.2em'
    },
    text: function(x) { return x.toFixed(0); }
  });

  dvl.bind({
    parent: tickGroup,
    self: 'line.horizontal',
    data: yTicks,
    join: dvl.identity,
    attr: {
      x1: 0,
      y1: sy,
      x2: innerWidth,
      y2: sy
    }
  });

  dvl.bind({
    parent: tickGroup,
    self: 'text.y',
    data: yTicks,
    join: dvl.identity,
    attr: {
      x: 0,
      y: sy,
      dy: '.32em'
    },
    text: function(x) { return x.toFixed(0); }
  });

  dvl.bindSingle({
    parent: tickGroup,
    self: 'text.label-x',
    datum: metricX,
    attr: {
      x: innerWidth,
      y: innerHeight,
      dy: '2em',
    },
    style: {
      'text-anchor': 'end',
    },
    text: String
  });

  dvl.bindSingle({
    parent: tickGroup,
    self: 'text.label-y',
    datum: metricY,
    attr: {
      x: 0,
      y: 0,
      dy: '-0.2em',
    },
    style: {
      'text-anchor': 'end',
    },
    text: String
  });

  var selectedColor = dvl.applyAlways({
    args: selData,
    fn: function(_selData) {
      _selData = _selData || [];
      return function(d) {
        return (_selData.indexOf(d) != -1 ? '#41BF28' : '#4682b4');
      }
    }
  });

  var fillColor = dvl.applyAlways({
    args: selData,
    fn: function(_selData) {
      _selData = _selData || [];
      return function(d) {
        return (_selData.indexOf(d) != -1 ? '#41BF28' : 'none');
      }
    }
  });

  dvl.bind({
    parent: dvl.bindSingle({ parent: cont, self: 'g.vis' }),
    self: 'circle',
    data: data,
    join: dvl.acc('time'),
    attr: {
      r: 3,
      cx: dvl.chain(getX, sx),
      cy: dvl.chain(getY, sy)
    },
    style: {
      stroke: selectedColor,
      fill: fillColor,
    }
  });

  dvl.bindSingle({
    parent: cont,
    self: 'rect.highlight',
    attr: {
      x: dvl.apply(selStartX, sx),
      y: dvl.apply(selEndY, sy),
      width:  dvl.op.sub(
        dvl.apply(selEndX, sx),
        dvl.apply(selStartX, sx)
      ),
      height: dvl.op.sub(
        dvl.apply(selStartY, sy),
        dvl.apply(selEndY, sy)
      )
    },
    style: {
      display: dvl.op.iff(mySelection, null, 'none')
    }
  })
}






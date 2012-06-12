function time(args) {
  var parent = args.parent;
  var width = args.width;
  var height = args.height;
  var data = args.data;
  var time = dvl.wrapConstIfNeeded(args.time);
  var metric = dvl.wrapConstIfNeeded(args.metric);
  var selData = args.selData || dvl.def(null, 'sel_data');
  var selHolder = args.selHolder || dvl.def(null, 'sel_holder');
  var me = {};
  var transition = { duration: 200 };
  var selTransition = dvl.def(transition);

  var mySelection = dvl.apply({
    args: selHolder,
    fn: function(_selHolder) { return _selHolder === me; },
    invalid: false
  });

  var getX = dvl.acc(time);
  var getY = dvl.acc(metric);

  var margin = { top: 15, bottom: 30, left: 70, right: 10 };

  var innerWidth  = dvl.op.sub(width, margin.left, margin.right);
  var innerHeight = dvl.op.sub(height, margin.top, margin.bottom);

  var sx = dvl.apply({
    args: [innerWidth, data, getX],
    fn: function(w, data, fn) {
      var min = d3.min(data, fn);
      var max = d3.max(data, fn);
      return d3.scale.linear().domain([min, max]).range([0, w]);
    }
  });

  var sy = dvl.apply({
    args: [innerHeight, data, getY],
    fn: function(h, data, fn) {
      var min = d3.min(data, fn);
      var max = d3.max(data, fn);
      return d3.scale.linear().domain([min, max]).range([h, 0]);
    }
  });

  var svg = dvl.bindSingle({
    parent: parent,
    self: 'svg.time',
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

  var selStartX = dvl.def().name('sel_start_x');
  var selEndX = dvl.def().name('sel_end_x');

  dvl.register({
    listen: [mySelection, data, selStartX, selEndX, time],
    change: [selData],
    fn: function() {
      if (!mySelection.get()) return;

      var _data = data.get();
      var _selStartX = selStartX.get();
      var _selEndX = selEndX.get();
      var _time = time.get();

      if (_data == null || _selStartX == null || _selEndX == null || _time == null) {
        selData.set(null).notify();
      } else {
        var _selData = [];
        for (var i = 0; i < _data.length; i++) {
          var d = _data[i];
          var dx = d[_time];
          if (_selStartX <= dx && dx <= _selEndX) {
            _selData.push(d);
          }
        };
        selData.set(_selData).notify();
      }
    }
  });

  var startDataX = null;
  var panelNode = cont.get().node();
  function updateRect() {
    if (startDataX == null) return;

    var mouse = d3.svg.mouse(panelNode);
    var mX = sx.value().invert(mouse[0]);

    selStartX.set(Math.min(startDataX, mX));
    selEndX.set(Math.max(startDataX, mX));

    dvl.notify(selStartX, selEndX);
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

        selStartX.set(null);
        selEndX.set(null);
        selData.set(null);
        selTransition.value(null);

        dvl.notify(selStartX, selEndX, selData);
      },
      mousemove: function() {
        if (startDataX == null) return;
        selHolder.set(me).notify();
        updateRect();
      },
      mouseup: function() {
        if (startDataX == null) return;
        updateRect();
        startDataX = null;
        selTransition.value(transition);
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
    },
    transition: transition
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
    text: dvl.apply(sx, function(x) { return x.tickFormat(); }),
    transition: transition
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
    },
    transition: transition
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
    text: dvl.apply(sy, function(x) { return x.tickFormat(); }),
    transition: transition
  });

  dvl.bindSingle({
    parent: tickGroup,
    self: 'text.label-x',
    datum: time,
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
    datum: metric,
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

  var vis = dvl.bindSingle({
    parent: cont,
    self: 'g.vis'
  });

  // dvl.svg.line({
  //   panel: panel,
  //   duration: duration,
  //   props: {
  //     key: dvl.gen.fromArray(data, getX),
  //     left: dvl.gen.fromArray(data, getX, sx.scale),
  //     bottom: dvl.gen.fromArray(data, getY, sy.scale)
  //   }
  // });

  var scaledX = dvl.chain(getX, sx);
  var scaledY = dvl.chain(getY, sy);

  var lineFn = dvl.apply({
    args: [scaledX, scaledY],
    fn: function(fx, fy) {
      return d3.svg.line().x(fx).y(fy);
    }
  })

  dvl.bind({
    parent: vis,
    self: 'path',
    data: dvl.op.list(data),
    attr: {
      d: lineFn
    },
    transition: transition
  });

  dvl.bind({
    parent: vis,
    self: 'circle',
    data: selData,
    join: getX,
    attr: {
      r: 3,
      cx: scaledX,
      cy: scaledY
    },
    transition: selTransition
  })

  dvl.bindSingle({
    parent: cont,
    self: 'rect.highlight',
    attr: {
      x: dvl.apply(selStartX, sx),
      y: 0,
      width:  dvl.op.sub(
        dvl.apply(selEndX, sx),
        dvl.apply(selStartX, sx)
      ),
      height: innerHeight
    },
    style: {
      display: dvl.op.iff(mySelection, null, 'none')
    },
    transition: selTransition
  })
}

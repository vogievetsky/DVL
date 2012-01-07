function time(args) {
  var selector = args.selector;
  var data = args.data;
  var time = dvl.wrapConstIfNeeded(args.time);
  var metric = dvl.wrapConstIfNeeded(args.metric);
  var selData = args.selData || dvl.def(null, 'sel_data');
  var selHolder = args.selHolder || dvl.def(null, 'sel_holder');
  var me = {};
  var duration = 200;
  var selDuration = dvl.def(duration, 'sel_duration');

  var mySelection = dvl.apply({
    args: selHolder,
    fn: function(_selHolder) { return _selHolder === me; },
    invalid: false
  });

  var getX = dvl.acc(time);
  var getY = dvl.acc(metric);

  var panel = dvl.svg.canvas({
    selector: selector,
    width: 1400,
    height: 400,
    margin: { top: 30, bottom: 30, left: 70, right: 30 },
    classStr: 'time'
  });

  var sx = dvl.scale.linear({
    name: "scale_x",
    domain: { data:data, acc:getX, sorted:true },
    rangeFrom: 0,
    rangeTo: panel.width,
    padding: 10
  })

  var sy = dvl.scale.linear({
    name: "scale_y",
    domain: { data:data, acc:getY },
    rangeFrom: 0,
    rangeTo: panel.height,
    padding: 10
  });


  var startDataX = null;

  var selStartX = dvl.def(null, 'sel_start_x');
  var selEndX = dvl.def(null, 'sel_end_x');

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

  var panelNode = panel.g.node();
  function updateRect() {
    if (startDataX == null) return;

    var mouse = d3.svg.mouse(panelNode);
    var mX = sx.invert.get()(mouse[0]);

    selStartX.set(Math.min(startDataX, mX));
    selEndX.set(Math.max(startDataX, mX));

    dvl.notify(selStartX, selEndX);
  }

  panel.g.on('mousedown', function() {
    var mouse = d3.svg.mouse(panelNode);
    startDataX = sx.invert.get()(mouse[0]);

    selStartX.set(null);
    selEndX.set(null);
    selData.set(null);
    selDuration.set(0).notify();

    dvl.notify(selStartX, selEndX, selData);
  }).on('mousemove', function() {
    if (startDataX == null) return;
    selHolder.set(me).notify();
    updateRect();
  }).on('mouseup', function() {
    if (startDataX == null) return;
    updateRect();
    startDataX = null;
    selDuration.set(duration).notify();
  });


  var scaledTicksX = dvl.gen.fromArray(sx.ticks, null, sx.scale),
      scaledTicksY = dvl.gen.fromArray(sy.ticks, null, sy.scale);

  dvl.svg.lines({
    panel: panel,
    duration: duration,
    props: {
      key: sx.ticks,
      left: scaledTicksX,
      top1: 0,
      bottom2: 0
    }
  });

  dvl.svg.lines({
    panel: panel,
    duration: duration,
    props: {
      key: sy.ticks,
      bottom: scaledTicksY,
      left1: 0,
      right2: 0
    }
  });

  dvl.svg.labels({
    panel: panel,
    duration: duration,
    props: {
      key: sx.ticks,
      left: scaledTicksX,
      bottom: -3,
      text: dvl.gen.fromArray(sx.ticks, null, sx.format),
      baseline: "top",
      align: "middle"
    }
  });

  dvl.svg.labels({
    panel: panel,
    duration: duration,
    props: {
      key: sy.ticks,
      left: -3,
      bottom:  scaledTicksY,
      text: dvl.gen.fromArray(sy.ticks, null, sy.format),
      align: "end",
      baseline: "middle"
    }
  });

  dvl.svg.labels({
    panel: panel,
    props: {
      right: 0,
      bottom: -17,
      text: time,
      align: "end",
      baseline: "top"
    }
  });

  dvl.svg.labels({
    panel: panel,
    props: {
      top: -5,
      left: 2,
      text: metric,
      baseline: "bottom"
    }
  });

  dvl.svg.line({
    panel: panel,
    duration: duration,
    props: {
      key: dvl.gen.fromArray(data, getX),
      left: dvl.gen.fromArray(data, getX, sx.scale),
      bottom: dvl.gen.fromArray(data, getY, sy.scale)
    }
  });

  ret = dvl.svg.dots({
    panel: panel,
    duration: duration,
    props: {
      key: dvl.gen.fromArray(selData, getX),
      left: dvl.gen.fromArray(selData, getX, sx.scale),
      bottom: dvl.gen.fromArray(selData, getY, sy.scale),
      radius: 3
    }
  });

  dvl.svg.bars({
    panel: panel,
    visible: mySelection,
    duration: selDuration,
    classStr: 'highlight',
    props: {
      left: dvl.gen.fromValue(selStartX, sx.scale),
      top: 0,
      bottom: 0,
      width: dvl.gen.sub(
        dvl.gen.fromValue(selEndX, sx.scale),
        dvl.gen.fromValue(selStartX, sx.scale)
      )
    }
  });
}

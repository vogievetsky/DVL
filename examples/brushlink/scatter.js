function scatter(args) {
  var selector = args.selector;
  var data = args.data;
  var metricX = dvl.wrapConstIfNeeded(args.metricX);
  var metricY = dvl.wrapConstIfNeeded(args.metricY);
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

  var getX = dvl.acc(metricX);
  var getY = dvl.acc(metricY);

  var panel = dvl.svg.canvas({
    selector: selector,
    width: 500,
    height: 500,
    margin: { top: 15, bottom: 70, left: 70, right: 30 },
    classStr: 'scatter'
  });

  var sx = dvl.scale.linear({
    name: "scale_x",
    domain: { data:data, acc:getX },
    rangeFrom: 0,
    rangeTo: panel.width,
    padding: 10
  })

  var sy = dvl.scale.linear({
    name: "scale_y",
    domain: { data:data, acc:getY },
    rangeFrom: panel.height,
    rangeTo: 0,
    padding: 10
  });

  var startDataX = null;
  var startDataY = null;

  var selStartX = dvl.def(null, 'sel_start_x');
  var selStartY = dvl.def(null, 'sel_start_y');
  var selEndX = dvl.def(null, 'sel_end_x');
  var selEndY = dvl.def(null, 'sel_end_y');

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

  var panelNode = panel.g.node();
  function updateRect() {
    if (startDataX == null || startDataY == null) return;

    var mouse = d3.svg.mouse(panelNode);
    var mX = sx.invert.get()(mouse[0]);
    var mY = sy.invert.get()(mouse[1]);

    selStartX.set(Math.min(startDataX, mX));
    selStartY.set(Math.min(startDataY, mY));
    selEndX.set(Math.max(startDataX, mX));
    selEndY.set(Math.max(startDataY, mY));

    dvl.notify(selStartX, selStartY, selEndX, selEndY);
  }

  panel.g.on('mousedown', function() {
    var mouse = d3.svg.mouse(panelNode);
    startDataX = sx.invert.get()(mouse[0]);
    startDataY = sy.invert.get()(mouse[1]);

    selStartX.set(null);
    selStartY.set(null);
    selEndX.set(null);
    selEndY.set(null);
    selData.set(null);
    selDuration.set(0).notify();

    dvl.notify(selStartX, selStartY, selEndX, selEndY, selData);
  }).on('mousemove', function() {
    if (startDataX == null || startDataY == null) return;
    selHolder.set(me).notify();
    updateRect();
  }).on('mouseup', function() {
    if (startDataX == null || startDataY == null) return;
    updateRect();
    startDataX = null;
    startDataY = null;
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
      top: scaledTicksY,
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
      top: scaledTicksY,
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
      text: metricX,
      align: "end",
      baseline: "top"
    }
  });

  dvl.svg.labels({
    panel: panel,
    props: {
      top: -5,
      left: 2,
      text: metricY,
      baseline: "bottom"
    }
  });

  var selectedColor = dvl.apply({
    args: selData,
    fn: function(_selData) {
      return function(d) {
        return (_selData.indexOf(d) != -1 ? '#41BF28' : '#4682b4');
      }
    },
    invalid: function() { return '#4682b4'; }
  });

  var fillColor = dvl.apply({
    args: selData,
    fn: function(_selData) {
      return function(d) {
        return (_selData.indexOf(d) != -1 ? '#41BF28' : 'none');
      }
    },
    invalid: function() { return 'none'; }
  });

  dvl.svg.dots({
    panel: panel,
    duration: duration,
    props: {
      key: dvl.gen.fromArray(data, dvl.acc('time')),
      radius: 3,
      left: dvl.gen.fromArray(data, getX, sx.scale),
      top: dvl.gen.fromArray(data, getY, sy.scale),
      stroke: dvl.gen.fromArray(data, null, selectedColor),
      fill: dvl.gen.fromArray(data, null, fillColor),
    }
  });

  dvl.svg.bars({
    panel: panel,
    visible: mySelection,
    duration: selDuration,
    classStr: 'highlight',
    props: {
      left: dvl.gen.fromValue(selStartX, sx.scale),
      top:  dvl.gen.fromValue(selEndY, sy.scale),
      width:  dvl.gen.sub(
        dvl.gen.fromValue(selEndX, sx.scale),
        dvl.gen.fromValue(selStartX, sx.scale)
      ),
      height: dvl.gen.sub(
        dvl.gen.fromValue(selStartY, sy.scale),
        dvl.gen.fromValue(selEndY, sy.scale)
      )
    }
  })
}






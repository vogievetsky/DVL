function rollup(data, dimension) {
  var counts = dvl.def(null, 'counts');
  var values = dvl.def(null, 'values');

  dvl.register({
    listen: [data, dimension],
    change: [counts, values],
    fn: function() {
      var _data = data.get();
      var _dimension = dimension.get();

      if (_data == null || _dimension == null) {
        counts.set(null);
        values.set(null);
      } else {
        var seen = {};
        for (var i = 0; i < _data.length; i++) {
          var dim = _data[i][_dimension];
          seen[dim] = (seen[dim] || 0) + 1;
        }

        _counts = [];
        _values = [];
        for (var d in seen) {
          _counts.push({ d: d, v: seen[d] });
          _values.push(d);
        }
        counts.set(_counts);
        values.set(_values.sort());
      }

      dvl.notify(counts, values);
    }
  })

  return {
    counts: counts,
    values: values
  }
}


function histogram(args) {
  var selector = args.selector;
  var dataRaw = args.data;
  var dimension = dvl.wrapConstIfNeeded(args.dimension);
  var selDataRaw = args.selData || dvl.def(null, 'sel_data');
  var selHolder = args.selHolder || dvl.def(null, 'sel_holder');
  var me = {};
  var duration = 200;
  var selDuration = dvl.def(duration, 'sel_duration');

  var roll = rollup(dataRaw, dimension);
  var data = roll.counts;

  var selRoll = rollup(selDataRaw, dimension);
  var selData = selRoll.counts;

  var getX = dvl.acc('v');
  var getY = dvl.acc('d');

  var panel = dvl.svg.canvas({
    selector: selector,
    width: 400,
    height: 200,
    margin: { top: 30, bottom: 30, left: 70, right: 10 },
    classStr: 'histogram'
  });

  var sx = dvl.scale.linear({
    name: "scale_x",
    domain: { data:data, acc:getX },
    rangeFrom: 0,
    rangeTo: panel.width,
    padding: 10,
    anchor: true
  })

  var sy = dvl.scale.ordinal({
    name: "scale_y",
    domain: { data:roll.values },
    rangeFrom: 0,
    rangeTo: panel.height,
    padding: 10
  });

  var scaledTicksX = dvl.gen.fromArray(sx.ticks, null, sx.scale),
      scaledTicksY = dvl.gen.fromArray(sy.ticks, null, sy.scale);

  var formatedTicksX = dvl.gen.fromArray(sx.ticks, null, function(d) { return d.toFixed(0); });

  var sizeY = dvl.apply({
    fn: function(b) { return 0.9 * b; },
    args: sy.band
  });

  var zeroPoint = dvl.gen.fromValue(dvl.zero, sx.scale);

  var selectedDims = dvl.def({}, 'selected_dims');

  dvl.register({
    listen: [dataRaw, selectedDims],
    change: [selHolder, selDataRaw],
    fn: function() {
      _dataRaw = dataRaw.get();
      _dimension = dimension.get();
      _selectedDims = selectedDims.get();
      if (_dataRaw == null || _dimension == null) return;

      var _selDataRaw = [];
      for (var i = 0; i < _dataRaw.length; i++) {
        var d = _dataRaw[i];
        if (_selectedDims[d[_dimension]]) {
          _selDataRaw.push(d);
        }
      }

      selHolder.set(me);
      selDataRaw.set(_selDataRaw);
      dvl.notify(selHolder, selDataRaw);
    }
  })

  dvl.svg.bars({
    panel: panel,
    duration: duration,
    props: {
      key: dvl.gen.fromArray(data, getY),
      left: zeroPoint,
      centerY: dvl.gen.fromArray(data, getY, sy.scale),
      width: dvl.gen.sub(dvl.gen.fromArray(data, getX, sx.scale), zeroPoint),
      height: sizeY
    },
    eventData: dvl.gen.fromArray(data, getY),
    on: {
      click: function(what) {
        _selectedDims = selectedDims.get();
        if (d3.event.shiftKey) {
          _selectedDims[what] = !_selectedDims[what];
        } else {
          _selectedDims = {};
          _selectedDims[what] = true;
        }
        selectedDims.set(_selectedDims).notify();
      }
    }
  });

  dvl.svg.bars({
    panel: panel,
    duration: duration,
    classStr: 'selection',
    props: {
      key: dvl.gen.fromArray(selData, getY),
      left: zeroPoint,
      centerY: dvl.gen.fromArray(selData, getY, sy.scale),
      width: dvl.gen.sub(dvl.gen.fromArray(selData, getX, sx.scale), zeroPoint),
      height: sizeY
    }
  });

  dvl.svg.lines({
    panel: panel,
    duration: duration,
    props: {
      key: sx.ticks,
      left: scaledTicksX,
      top1: 0,
      bottom2: 0,
      stroke: "white"
    }
  });

  dvl.svg.lines({
    panel: panel,
    duration: duration,
    props: {
      left: 10,
      top1: 0,
      bottom2: 0,
      stroke: "black"
    }
  });

  dvl.svg.labels({
    panel: panel,
    duration: duration,
    props: {
      key: sx.ticks,
      left: scaledTicksX,
      bottom: -3,
      text: formatedTicksX,
      baseline: "top",
      align: "middle"
    }
  });

  dvl.svg.labels({
    panel: panel,
    duration: duration,
    props: {
      key: sx.ticks,
      left: scaledTicksX,
      top: -3,
      text: formatedTicksX,
      baseline: "bottom",
      align: "middle"
    }
  });

  dvl.svg.labels({
    panel: panel,
    duration: duration,
    props: {
      key: sy.ticks,
      left: -3,
      top:  scaledTicksY,
      text: sy.ticks,
      align: "end",
      baseline: "middle"
    }
  });
}
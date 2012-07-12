function rollup(data, dimension) {
  var counts = dvl().name('counts');
  var values = dvl().name('values');

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

/*
{
  parent
  width
  height
  data
  dimension
  selData
  selHolder
}
*/
function bar(args) {
  var parent = args.parent;
  var width = args.width;
  var height = args.height;
  var dataRaw = args.data;
  var dimension = dvl.wrap(args.dimension);
  var selDataRaw = dvl.wrapVar(args.selData);
  var selHolder =  dvl.wrapVar(args.selHolder);
  var me = {};
  var transition = { duration: 200 };
  var selTransition = dvl(transition);

  var roll = rollup(dataRaw, dimension);
  var data = roll.counts;

  var selRoll = rollup(selDataRaw, dimension);
  var selData = selRoll.counts;

  var getX = dvl.acc('v');
  var getY = dvl.acc('d');

  var margin = { top: 15, bottom: 30, left: 70, right: 10 };

  var innerWidth  = dvl.op.sub(width, margin.left, margin.right);
  var innerHeight = dvl.op.sub(height, margin.top, margin.bottom);

  var sx = dvl.apply({
    args: [innerWidth, data, getX],
    fn: function(w, data, fn) {
      var max = d3.max(data, fn);
      return d3.scale.linear().domain([0, max*1.1]).range([0, w])
    }
  });

  var sy = dvl.apply({
    args: [innerHeight, roll.values],
    fn: function(h, data) {
      return d3.scale.ordinal().domain(data).rangeRoundBands([0, h], .1);
    }
  });

  var sizeY = dvl.apply(sy, function(s) { return s.rangeBand()*0.8; });
  var halfSizeY = dvl.apply(sizeY, function(d) { return d/2; });

  var zeroPoint = dvl.apply(dvl.zero, sx);

  var selectedDims = dvl({}).name('selected_dims');

  dvl.register({
    listen: [dataRaw, selectedDims, selHolder],
    change: [selDataRaw],
    fn: function() {
      _dataRaw = dataRaw.get();
      _dimension = dimension.get();
      _selectedDims = selectedDims.get();
      _selHolder = selHolder.get();
      if (_dataRaw == null || _dimension == null || _selHolder !== me) return;

      var _selDataRaw = [];
      for (var i = 0; i < _dataRaw.length; i++) {
        var d = _dataRaw[i];
        if (_selectedDims[d[_dimension]]) {
          _selDataRaw.push(d);
        }
      }

      selDataRaw.set(_selDataRaw).notify();
    }
  });

  var svg = dvl.bindSingle({
    parent: parent,
    self: 'svg.histogram',
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

  dvl.bindSingle({
    parent: cont,
    self: 'rect.background',
    attr: {
      width:  innerWidth,
      height: innerHeight
    }
  });

  var scaledX = dvl.chain(getX, sx);
  var scaledY = dvl.chain(getY, sy);

  dvl.bind({
    parent: dvl.bindSingle({ parent: cont, self: 'g.normal' }),
    self: 'rect.bar',
    data: data,
    join: getY,
    attr: {
      x: zeroPoint,
      y: scaledY,
      width: dvl.op.sub(scaledX, zeroPoint),
      height: sizeY
    },
    on: {
      click: function(what) {
        what = getY.value()(what);
        _selectedDims = selectedDims.get();
        if (d3.event.shiftKey) {
          _selectedDims[what] = !_selectedDims[what];
        } else {
          _selectedDims = {};
          _selectedDims[what] = true;
        }
        selectedDims.set(_selectedDims);
        selHolder.set(me);
        dvl.notify(selectedDims, selHolder);
      }
    },
    transition: transition
  });

  dvl.bind({
    parent: dvl.bindSingle({ parent: cont, self: 'g.selection' }),
    self: 'rect.bar',
    data: selData,
    join: getY,
    attr: {
      x: zeroPoint,
      y: scaledY,
      width: dvl.op.sub(scaledX, zeroPoint),
      height: sizeY
    },
    transition: transition
  });

  var tickGroup = dvl.bindSingle({ parent: cont, self: 'g.ticks' });
  var xTicks = dvl.apply(sx, function(s) { return s.ticks(7); });

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
    self: 'text.x.top',
    data: xTicks,
    join: dvl.identity,
    attr: {
      x: sx,
      y: 0,
      dy: '-0.2em'
    },
    text: function(x) { return x.toFixed(0); },
    transition: transition
  });

  dvl.bind({
    parent: tickGroup,
    self: 'text.x.bottom',
    data: xTicks,
    join: dvl.identity,
    attr: {
      x: sx,
      y: innerHeight,
      dy: '1.2em'
    },
    text: function(x) { return x.toFixed(0); },
    transition: transition
  });

  // dvl.svg.lines({
  //   panel: panel,
  //   duration: duration,
  //   props: {
  //     left: 10,
  //     top1: 0,
  //     bottom2: 0,
  //     stroke: "black"
  //   }
  // });

  dvl.bind({
    parent: tickGroup,
    self: 'text.y',
    data: roll.values,
    join: dvl.identity,
    attr: {
      x: -5,
      y: dvl.op.add(sy, halfSizeY),
      dy: '.32em'
    },
    text: String,
    transition: transition
  });
}
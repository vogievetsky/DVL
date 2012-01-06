function generateData() {
  var realtime = dvl.def(false, 'realtime');
  var metrics = ['aa', 'bb', 'cc'];

  var t = 0;
  var lastD = 0.5;
  var dims = ['Apple', 'Banana', 'Chery', 'Mustard'];
  function genOne() {
    t++;
    var r = Math.random();
    var aa = r*r;
    var bb = Math.random() * 0.2;
    var cc = bb * 10 + Math.random();
    lastD += (Math.random() - 0.5) * 0.1;
    return {
      time: t,
      aa:aa,
      bb:bb,
      cc:cc,
      dd:lastD,
      dim:dims[Math.floor(r * dims.length)]
    };
  }

  var data = [];
  for (var i = 0; i < 100; i++) {
    data.push(genOne())
  }

  var dataDVL = dvl.def(data, 'data');

  setInterval(function() {
    if (!realtime.get()) return;
    data.push(genOne());
    dataDVL.set(data).notify();
  }, 250);

  return {
    data: dataDVL,
    metrics: dvl.def(metrics, 'metrics'),
    realtime: realtime
  }
}
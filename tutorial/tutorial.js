var body = d3.select("body");

body.append("h1").text("A DVL Walkthrough");

var introQuestion = "What is DVL and why would I want to use it?"
body.append("h2").text(introQuestion);

var introAnswer = "DVL (Data Visualization Legos) reduces the effort of creating data visualizations of real-time data in the browser. You specify the data and a directed acyclic graph. When the data is updated, only those functions dependent on the changed data are updated. Essentially, you model the data flow and then spend your time working with the data."
body.append("h3").text(introAnswer);

body.append("h2").text("OK. Show me an example. A simple one to get started.");

var coord = dvl(5);
setInterval(function() {
	coord.value(coord.value() + coord.value() * 0.1);
	//coordOutput.text(coord.value());
}, 100);
var getCoord = dvl.apply([coord], function(coord) { 
	return x;
});
var consoleOutput = dvl.bind({
	//parent: body.append("div").attr("class", "coordOutput"),
	parent: d3.select('body'),
	self: 'p.output',
	data: getCoord,
	style: {
		width: 200,
		height: 200
	},
	text: getCoord
});

///////////////////////

var now = dvl(new Date());
var x;

setInterval(function() {
	now.value(new Date)
}, 1000);

    var time = dvl.apply([now], function(now) {
      var time = now.valueOf();
      x = d3.range(1).map(function(o) { return new Date(time - o * 60*60*1000); })
      return x;
    })

    var clock = dvl.bind({
      parent: d3.select('body'),
      self: 'svg.clock',
      data: time,
      attr: {
        width: 200,
        height: 200
      }
    });

    var sinOp = dvl.op(function(x, r, a) { return x + r * Math.sin(a); });
    var cosOp = dvl.op(function(y, r, a) { return y - r * Math.cos(a); });

    // { parent, classStr, data, x, y, minRadius, maxRadius, angle } = args
    function angularLines(args) {
      return dvl.bind({
        parent: args.parent,
        self: 'line.' + args.classStr,
        data: args.data,
        attr: {
          x1: sinOp(args.x, args.minRadius, args.angle),
          y1: cosOp(args.x, args.minRadius, args.angle),
          x2: sinOp(args.x, args.maxRadius, args.angle),
          y2: cosOp(args.x, args.maxRadius, args.angle)
        }
      });
    }

    var PI2 = Math.PI * 2;

    angularLines({
      parent: clock,
      classStr: 'sec',
      x: 100,
      y: 100,
      minRadius: 10,
      maxRadius: 99,
      angle: function(d) { return PI2 * d.getSeconds()/60; }
    });

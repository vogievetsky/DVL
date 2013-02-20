var coord = dvl(0);
var coord2 = dvl(1);

setInterval(function() {
	coord.value(coord.value() + 0.01);
	coord2.value(coord2.value() + 0.02);
}, 500);

var coords = dvl.op.list(coord, coord2);

var consoleOutput = dvl.bind({
	parent: d3.select('div#ex03'),
	self: 'p.output',
	data: coords,
	text: function(x) { return x.toFixed(2); }
});

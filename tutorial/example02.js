var coord = dvl(0);

setInterval(function() {
	coord.value(coord.value() + 0.01);
}, 500);

var coords = dvl.apply(coord, function(d) {
	return [d];})

var consoleOutput = dvl.bind({
	parent: d3.select('div#ex02'),
	self: 'p.output',
	data: coords,
	text: String
});

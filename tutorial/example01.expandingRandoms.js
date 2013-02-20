var coord = dvl(1);

setInterval(function() {
	console.log('oooo', coord.value())
	coord.value(coord.value() + 0.01);
}, 500);

var coords = dvl.apply(coord, function(d) {
	var ret = [];
	var n = Math.random() * 10
	for (var t = 0; t < n; t++) ret.push(n);
	return ret;
})

dvl.debug('coord', coord)

var consoleOutput = dvl.bind({
	parent: d3.select('div#ex01'),
	self: 'p.output',
	data: coords,
	text: String
});

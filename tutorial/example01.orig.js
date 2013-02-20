var coord = dvl(1);

setInterval(function() {
	coord.value(coord.value() + 0.01);
}, 500);

var getCoord = function() {
	return [coord.value];
}

var consoleOutput = dvl.bind({
	parent: d3.select('div#ex01'),
	self: 'p.output',
	data: getCoord,
	text: coord
});

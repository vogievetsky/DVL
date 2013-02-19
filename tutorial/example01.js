var coord = dvl(5);
setInterval(function() {
	coord.value(coord.value() + coord.value() * 0.01);
}, 500);

var getCoord = dvl.apply([coord], function(coord) { 
	return [7];
});

var consoleOutput = dvl.bind({
	parent: d3.select('body'),
	self: 'p.output',
	data: getCoord,
	text: coord
});

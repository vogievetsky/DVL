var coord = dvl(0);

setInterval(function() {
	coord.value(coord.value() + 0.01);
}, 500);

// var dummy = 1;
// setInterval(function() {
// 	dummy += 0.01;
// }, 500);

// var getCoord = function() {
// 	return [coord.value];
// }

var coords = dvl.apply(coord, function(d) {
	return [d];})

var consoleOutput = dvl.bind({
	parent: d3.select('div#ex02'),
	self: 'p.output',
	data: coords,
	text: String
});

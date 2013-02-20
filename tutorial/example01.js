var coord = dvl(0);

setInterval(function() {
	coord.value(coord.value() + 0.01);
}, 500);

dvl.bindSingle({
	self: d3.select('div#ex01'),
	text: coord
});

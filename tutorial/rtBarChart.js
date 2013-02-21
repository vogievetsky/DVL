var coordArray = dvl([0, 0]).compare(false);

setInterval(function() {
	_coordArray = coordArray.value();
	_coordArray[0] = _coordArray[0] + 0.1;
	coordArray.value(_coordArray);
}, 500);

dvl.bind({
	parent: d3.select('div#realTimeBarChart'),
	self: 'p.bar',
	data: coordArray,
	text: String
});

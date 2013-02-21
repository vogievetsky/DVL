//can slice to create a new array (with a new pointer, so the default comparison returns false)

var coordArray = dvl([0, 0]);

setInterval(function() {
	_coordArray = coordArray.value();
	_coordArray[0] = _coordArray[0] + 0.1;
	coordArray.value(_coordArray.slice());
}, 500);


//var coords = dvl.apply(coord, function(d) {
//	return coordArray;})


dvl.bindSingle({
	self: d3.select('div#realTimeBarChart'),
	text: coordArray
})

/*dvl.bind({
	parent: d3.select('div#realTimeBarChart'),
	self: 'p.thing',
	data: coords,
	text: String
});
*/
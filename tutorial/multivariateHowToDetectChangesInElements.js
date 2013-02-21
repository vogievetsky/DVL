//what DVL does by default: 
//var coordArray = dvl([0, 0]).compare(function(a,b) { return a === b});
//can override:
var coordArray = dvl([0, 0]).compare(function(a,b) { return false });

setInterval(function() {
	_coordArray = coordArray.value();
	_coordArray[0] = _coordArray[0] + 0.1;
	coordArray.value(_coordArray);
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
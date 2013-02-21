var coordArray = dvl([0, 0]).compare(false);

setInterval(function() {
	_coordArray = coordArray.value();
	_coordArray[0] = _coordArray[0] + 0.1;
	coordArray.value(_coordArray);
}, 500);


//var coords = dvl.apply(coord, function(d) {
//	return coordArray;})

printCord = function(cord) {
	return "{ " + cord[0] + ", " + cord[1] + " }";
}


dvl.bindSingle({
	self: d3.select('div#realTimeBarChart'),
	//text: dvl.apply(coordArray, printCord)
	text: dvl.apply({ args: coordArray, fn: printCord })
})

/*dvl.bind({
	parent: d3.select('div#realTimeBarChart'),
	self: 'p.thing',
	data: coords,
	text: String
});
*/
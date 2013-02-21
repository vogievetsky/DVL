var coordArray = dvl([0, 0]).compare(false);

setInterval(function() {
	_coordArray = coordArray.value();
	_coordArray[0] = _coordArray[0] + 0.1;
	coordArray.value(_coordArray);
}, 500);

printCord = function(cord) {
	return "{ " + cord[0] + ", " + cord[1] + " }";
}


dvl.bindSingle({
	self: d3.select('div#realTimeBarChart'),
	datum: coordArray,
	text: printCord
})

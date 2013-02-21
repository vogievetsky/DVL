var coordArray = dvl([0, 0]).compare(false);

setInterval(function() {
	_coordArray = coordArray.value();
	_coordArray[0] = _coordArray[0] + 0.1;
	coordArray.value(_coordArray);
}, 500);

printCord1 = function(cord) {
	return "{ " + cord[0].toFixed(2) + ", " + cord[1].toFixed(2) + " }";
}

printCord2 = function(cord) {
	return "< " + cord[0].toFixed(2) + ", " + cord[1].toFixed(2) + " >";
}

printCord = dvl(printCord1)
setInterval(function() {
	printCord.value(printCord.value() === printCord1 ? printCord2 : printCord1)
}, 1700);


dvl.bindSingle({
	self: d3.select('div#realTimeBarChart'),
	datum: coordArray,
	text: printCord
})

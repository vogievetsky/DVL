var coords = dvl([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).compare(false);
var barSpacing = 10;
var barWidth = 50;

setInterval(function() {
	_coords = coords.value();
	for (var i = 0; i < coords.value().length; i++) {
		if (Math.random() > 0.5)
		_coords[i] = _coords[i] + 1;
	}
	coords.value(_coords);
}, 200);

dvl.bind({
	parent: d3.select("#realTimeBarChart"),
	self: "div.bar",
	data: coords,
	text: String,
	style: {height: function (x) { return x + 50 + "px"; },
			left: function (x, i) { return (barWidth + barSpacing) * i + "px"; },
			width: barWidth
	}
})

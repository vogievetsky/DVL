var coord1 = dvl(0);
var coord2 = dvl(1);

setInterval(function() {
	coord1.value(coord.value() + 0.01);
	coord2.value(coord2.value() + 0.02);
}, 500);

var coords = dvl.apply([coord1, coord2], function(_coord1, _coord2) {
	return [_coord1, _coord2];
});
//or 
//var coords = dvl.op.list(coord1, coord2);

dvl.bind({
	parent: d3.select('div#ex03'),
	self: 'p.output',
	data: coords,
	text: function(x) { return x.toFixed(2); }
});

var coordBall1 = dvl(0);
var coordBall2 = dvl(0);

var speed1 = Math.random() * 10 + 1;
var speed2 = Math.random() * 10 + 1;

var maxMovement = 150;
setInterval(function() {
	var newCoord1 = coordBall1.value() + speed1;
	var newCoord2 = coordBall2.value() + speed2;
	var checkBounds = function(x) { if (x > maxMovement) x = 0; return x;};
	newCoord1 = checkBounds(newCoord1);
	newCoord2 = checkBounds(newCoord2);

	coordBall1.value(newCoord1);
	coordBall2.value(newCoord2);
}, 250);

var coords = dvl.op.list(coordBall1, coordBall2);

dvl.bind({
	parent: d3.select("div#divRace"),
	self: "div.racer",
	data: coords,
	style: {width: function (x) {
		return x + 50 + "px";}
	},
	text: function(x) { return x.toFixed(2); }
})

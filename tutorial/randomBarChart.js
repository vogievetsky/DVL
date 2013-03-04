var dataset = [];
var maxVal = 20;
var maxValInDataset;
var initialNumDataPoints = 10;
var nextKey; //datapoints have keys. This stores the next one

//initial dataset population done manually so dataset has expected number of elements
for (var i = 0; i < initialNumDataPoints; i++) {
	dataset.push(makeDataPoint());
	maxValInDataset = d3.max(dataset, function(d) { return d; });
}

function makeDataPoint() {
	return Math.round(Math.random() * maxVal * 0.85 + maxVal * 0.15);
}

function populateDataset() {
	var numDataPoints = dataset.length;
	dataset = [];
	for (var i=0; i < numDataPoints; i++) {
		dataset.push(makeDataPoint()); //set a min val so bars don't get too small for labels
	}
	maxValInDataset = d3.max(dataset, function(d) { return d; });
}

var margin = {left: 40, right: 10, top: 10, bottom: 20};
var svgFullSize = {width: 500, height: 500};
var svgPaddedSize = {
	width: svgFullSize.width - margin.left - margin.right,
	height: svgFullSize.height - margin.top - margin.bottom
};
var labelShift = 1.03;

//scale functions
var getScaleYHeight = function() {
	var returnFun = d3.scale.linear()
		.domain([0, maxValInDataset])
		.range([0, svgPaddedSize.height]);
	return returnFun;
}
var scaleYHeight = getScaleYHeight();
var getScaleYPosition = function() {
	var returnFun = d3.scale.linear()
		.domain([0, maxValInDataset])
		.range([svgPaddedSize.height, 0])
	return returnFun;
}
var scaleYPosition = getScaleYPosition();
var scaleX = d3.scale.ordinal()
	.domain(d3.range(dataset.length))
	.rangeRoundBands([0, svgPaddedSize.width], 0.05);

var svg = d3.select("body").append("svg")
	.attr({
		width: svgFullSize.width, 
		height: svgFullSize.height
	})	
	.append("g")
	.attr({
		width: svgPaddedSize.width, 
		height: svgPaddedSize.height,
		transform: "translate(" + margin.left + ", " + margin.top + ")"
	});

//axes
var yAxis = d3.svg.axis().scale(scaleYPosition).orient("left");
var yAxisSVG = svg.append("g")
	.attr({
		class: "axis",
		id: "yaxis"
	})
	.call(yAxis);

var barPadding = 10;
var rectWidth = 40;

function setBars() { 
	var databars = svg.selectAll("rect.databar").data(dataset);
	//enter
	databars
		.enter()
		.append("rect")
		.attr( {
			class: "databar",
		}
	);

	databars
		.exit()
		.transition()
		.attr("height", 0)
		.remove();

	//update
	svg.selectAll("rect.databar").data(dataset)
		.transition().duration(1000)
		.attr({
			width: scaleX.rangeBand(),
			height: function(d) { return scaleYHeight(d); },
			x: function(d, i) { return scaleX(i); },
			y: function(d) { return svgPaddedSize.height - scaleYHeight(d); }
	});

}
setBars();

function setLabels() { 

	var labels = svg.selectAll("text.label").data(dataset);

	//enter
	labels.enter()
		.append("text")
		.transition().duration(1000)
		.attr({
			x: function(d, i) { return scaleX(i) + scaleX.rangeBand() / 2; },
			y: function(d) { return svgPaddedSize.height * labelShift - scaleYHeight(d); },
			"text-anchor": "middle",
			class: "label"
		})
		.text(function(d) { return d; });

	//exit
	labels.exit().remove();

	svg.selectAll("text.label")
		.data(dataset)
			.transition().duration(1000)
			.attr({
				x: function(d, i) { return scaleX(i) + scaleX.rangeBand() / 2; },
				y: function(d) { return svgPaddedSize.height * labelShift - scaleYHeight(d); },
				"text-anchor": "middle",
				class: "label"
			})
			.text(function(d) { return d; });
}
setLabels();

//update functions
var updateGraph = function() {
	updateScales();
	setBars();
	setLabels();
	updateAxes();
}

var updateScales = function() {
	scaleYHeight = getScaleYHeight();
	scaleYPosition = getScaleYPosition();
	scaleX = d3.scale.ordinal()
		.domain(d3.range(dataset.length))
		.rangeRoundBands([0, svgPaddedSize.width], 0.05);
}

var updateAxes = function() {
	yAxis = d3.svg.axis().scale(scaleYPosition).orient("left");
	var t = svg.transition().duration(750);
	t.select(".axis#yaxis").call(yAxis);
}

//buttons
d3.select("body").append("button")
	.text("Press to change data")
	.on("click", function() {
		populateDataset();		
		updateGraph();
	});

d3.select("body").append("button")
	.text("Press to add a data point")
	.on("click", function() {
		dataset.push(makeDataPoint());
		updateGraph();
	});

d3.select("body").append("button")
	.text("Press to remove a data point")
	.on("click", function() {
		dataset.pop();
		updateGraph();
	});

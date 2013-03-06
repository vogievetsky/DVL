var COUNTRIES = [null, "United States", "United Kingdom", "Canada", "Mexico", "England", 
				"Russia", "The United Kingdom of Great Britain and Northern Ireland"];


//example 01
var parentEx01 = d3.select("div#ex01");
dvl.html.dropdown({parent: parentEx01, 
				  data: COUNTRIES,
				  label: function(d) { return d === null ? "--" : d; }
				});

//example 02
var changingData = dvl.wrapVar(null);

setInterval(
	function () { 
		var val = changingData.value() === null ? COUNTRIES : null;
		changingData.value(val); 
	},
	2000);

var parentEx02 = d3.select("div#ex02");

dvl.bind({
	parent: parentEx02,
	self: "div#rawDataOutput",
	data: changingData,
	text: function (d) { return d; },
	style: {
		border: "solid 1px",
		width: "100px"
	}
});

dvl.html.dropdown({	parent: parentEx02, 
					data: changingData,
				  	label: function(d) { return d === null ? "--" : d; }
					});

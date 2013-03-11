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

dvl.html.dropdown({
  parent: parentEx02, 
	data: changingData,
  label: function(d) { return d === null ? "--" : d; }
});

//example 03
var countryCodes = [11, 112, 123, 235, 358];
var codeMappings = { 123: "United States", 235: "Canada", 358: "Mexico" };

var filteredCodes = dvl.apply(
	[countryCodes],
	function(_countryCodes) {
		return _countryCodes.filter(function (x) { return codeMappings[x] })
  }
);

var parentExCountryCodes = d3.select("div#ex-country-codes");

dvl.html.dropdown({	parent: parentExCountryCodes, 
				  	data: filteredCodes,
				  	label: function(d) { return d === null ? "--" : d; }
					});


/*
var COUNTRIES = ["United States", "United Kingdom", Canada", "Mexico", "England", "Russia"];

var text = dvl.wrapVar('');

var listParent = d3.select("body").append("div").attr("class", "dropdownParent");

dvl.html.list = dvl.html.list({parent: listParent, 
				  data: COUNTRIES,
				  selection: "Canada",
				  highlight: "Mexico"
				});
*/

var COUNTRIES = ["United States", "United Kingdom", "Canada", "Mexico", "England", "Russia"];

var text = dvl.wrapVar('');

var listParent = d3.select("body").append("div").attr("class", "dropdownParent");

dvl.html.list = dvl.html.dropdown({parent: listParent, 
				  data: COUNTRIES
				});

var COUNTRIES = [null, "United States", "United Kingdom", "Canada", "Mexico", "England", 
				"Russia", "The United Kingdom of Great Britain and Northern Ireland"];

var text = dvl.wrapVar('');

var listParent = d3.select("body").append("div").attr("class", "dropdown-parent");

dvl.html.list = dvl.html.dropdown({parent: listParent, 
				  data: COUNTRIES,
				  label: function(d) { return d === null ? "--" : d; }
				});

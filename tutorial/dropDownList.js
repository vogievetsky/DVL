var COUNTRIES = ['United States','China','France', 'Italy', 'Norway','Spain'];

/////////Example 01
var parent01 = d3.select("#ex01");
var ddl = dvl.html.list({
	parent: parent01,
	data: COUNTRIES
});

var countriesSubsetter = function() {
	var selectedCountries = [];
	var pickCountries = function() {
		selectedCountries = [];
		for (var i = 0; i < COUNTRIES.length; i++) {
			if (Math.random() > 0.5) { selectedCountries.push(COUNTRIES[i]); }
		}
		return selectedCountries;
	}
};

//////////////EX 02
var countriesSubset = dvl([]).compare(false);
var subsetterGenerator = function() {
	var selectedCountries = [];
	return function() {
		selectedCountries = [];
		for (var i = 0; i < COUNTRIES.length; i++) {
			if (Math.random() > 0.5) { selectedCountries.push(COUNTRIES[i]); }
		}
		return selectedCountries;
	}
};
subsetter = subsetterGenerator();

setInterval(function() { countriesSubset.value(subsetter()) }, 500);
//why does set not work?
//setInterval(function() { countriesSubset.set(subsetter()) }, 500);

var parent02 = d3.select("#ex02").style("height", "100px");
var ddl = dvl.html.list({
	parent: parent02,
	data: countriesSubset,
	label: function(d) { return d + " was subsetted"; }
});

////////////////EX 03
var parent02 = d3.select("#ex03");
var ddl = dvl.html.list({
	parent: parent02,
	data: COUNTRIES,
	label: function(d) { return d + " was run through 'label' function"; },
	selection: "China",
	classStr: "colorable"
});


////////////////EX 04
var parent02 = d3.select("#ex04");
var ddl = dvl.html.list({
	parent: parent02,
	data: COUNTRIES,
	label: function(d) { return d + " was run through 'label' function"; },
	selection: "China",
	onEnter: function(d, i) { console.log(i) }
});



//var addSelectField = function(label, selection, classStr, data, labelFn, visible, useSelect, readOnly, ignoreCase, onSelect) {
//
//  selection = dvl.wrapVar(selection);
//  defaultLabel = '--';
//  
//  labelFn = String;
//  
//  var dd = dvl.html.dropdown({
//    parent: parentElement,
//    classStr: dvl.op.iff(readOnly, 'form-dropdown read-only', 'form-dropdown'),
//    id: 5,
//    data: data,
//    //label: dvl.apply(labelFn, (_labelFn) -> (d) -> if d? then _labelFn(d) else defaultLabel),
//    label: dvl.apply(labelFn, function(_labelFn) { 
//    	return function(d) { 
//    		if (d != null) { 
//    			return _labelFn(d); 
//    		} else { 
//    			return defaultLabel;
//    		} 
//    	};
//    }),
//    selection: selection,
//    editable: true,
//    onSelect: onSelect
//  });
//  
//  var node = dd.node;
//  var open = dd.open;
//  
//  return {
//    node: node,
//    selection: selection
//  }
//};
//var sf = addSelectField('myLabel', 'China', 'myClass',)
//var selection = d3.select("body").insert("span.myClass", "#domManipExample").attr({class: "clearable"});;

var selection = d3.select("body").append("span.myClass");


var x = dvl.bindSingle({
	parent: selection,
	self: "div",
	attr: {class: "innerDivContainer"}
});

//returns an array of D3 selectors. (Or is a selector an array?)
var myDiv = x.value();

var textBox = dvl.bindSingle({
	parent: myDiv,
	self: 'input'
}).value();

textBox.attr({class: "textboxInput"});

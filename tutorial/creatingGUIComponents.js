"use strict";


var myString = "initial value";

var initialInput = d3.select("div#simpleD3Example").append("input").property("value", myString);
var mirroredInput = d3.select("div#simpleD3Example").append("input").property("value", myString);
initialInput.on({"keyup":  function() {
  myString = initialInput.property("value");
  mirroredInput.property("value", myString); 
}});

/////////////////////////

//TODO: how do I get access to input.clearable's value without doing another select?

var displayString = dvl("myDisplayString");

var clearableParent = d3.select("#clearableTextBoxExample");

var clearableTextBox = clearableParent.append("input.clearable");

var linked1 = dvl.bindSingle({
  parent: clearableParent,
  self: clearableTextBox,
  datum: displayString,
  property: {value: displayString},
  on: {
    keyup: function() { displayString.value("keyup"); }
  }
});

var clearButton = dvl.bindSingle({
  parent: clearableParent,
  self: "button.clearButton",
  text: "Click to clear",
  on: {
    click: function() { displayString.value(""); }
  }
});

dvl.debug("displayString", displayString);
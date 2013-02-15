var body = d3.select("body").append("h1").text("DVL UI Components")

var myData = [1, 2, 3, 4, 5]

var thing = {
	parent: body, 
	data: myData,
	classStr: "myDropdown",
	selections: ["sel1", "sel2", "sel3"]
}
var dropDown = dvl.html.dropdown(thing)
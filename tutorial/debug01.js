var COUNTRIES = [null, "US", "Canada"];
var COUNTRIES = dvl.wrap(COUNTRIES);

var labelFn = function (d) { return d? d : "--"; };
var labelFn = dvl.wrap(labelFn);

for country in COUNTRIES.value() { console.log(labelFn(country)); }

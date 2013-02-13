# DVL

**DVL** is a free functionally reactive library written in JavaScript. DVL is based on the idea that data, not control flow is the most important aspect of a program focused on data visualization.

DVL is built on top of [D3](http://mbostock.github.com/d3/) to allow for dynamic data binding to the DOM.

## Usage

The code DVL functionality can be described with the following functions:

**dvl**

Creates a DVL variable with the given initial value. A DVL variable's value can be read and set. When the value is updated it will automatically notify any code that depends on it.

```javascript
var x = dvl(5);
console.log(x.value()); //=> 5
x.value(7);
console.log(x.value()); //=> 7
```

A DVL variable can take any value that a regular JavaScript variable can take with the exception of `undefined` since through the virtue of being created a DVL variable is always defined. Setting the value of a DVL variable to `undefined` will cause it to be `null`.

```javascript
console.log(dvl().value()); //=> null
console.log(dvl(null).value()); //=> null
console.log(dvl(undefined).value()); //=> null
console.log(dvl(5).value(undefined).value()); //=> null
```

A DVL variable is considered invalid if its value is set to `null`. It is perfectly fine to have variables in an invalid state but some functions will treat invalid variables as a special case.

**dvl.apply**

The apply function is one of the most useful functions in DVL. It creates a new DVL variable, the value of which tracks the result of the given function as applied to the supplied parameters.

```javascript
var a = dvl(5);
var b = dvl(12);

var c = dvl.apply([a, b], function(_a, _b) {
	return Math.sqrt(_a * _a + _b * _b);
});

console.log(c.value()) //=> 13

a.value(3)
console.log(c.value()) //=> 12.36931687685298

b.value(4)
console.log(c.value()) //=> 5
```

The 'worker function' in the apply gets called with the actual values of the variables.

_Note: The suggested convention is to name the 'value parameters' with a leading underscore to aid readability by visually separating the DVL variable form it's actual value. This convention is adopted here._

If any of the arguments to a DVL apply function are invalid (value of `null`) then the 'worker function' will not be called and instead the result will be set to invalid.

```javascript
b.value(null)
console.log(c.value()) //=> null

b.value(4)
console.log(c.value()) //=> 5
```

**dvl.applyAlways**

Auto invalidation is often the desired behavior and a convenience since the arguments within the 'worker function' will never be null, but sometimes it does make sense for the result of the apply to be something valid even if some of the arguments are invalid.

```javascript
var who = dvl('Jason');
var what = dvl('cake');

var likes = dvl.applyAlways([who, what], function(_who, _what) {
  if (_who === null) {
  	return null; // Deal with the case of not having a 'who', set likes to invalid.
	}
	return _who + (_what === null ? ' does not like anything.' : ' likes ' + _what + '!');
});

console.log(likes.value()) //=> 'Jason likes cake!'

what.value('flying')
console.log(likes.value()) //=> 'Jason likes flying!'

what.value(null)
console.log(likes.value()) //=> 'Jason does not like anything.'

who.value(null)
console.log(likes.value()) //=> null
```

**dvl.register**

Registers a low level function that registers a function to be called reactively when a DVL variable changes. The `apply` and `applyAlways` functions are just convenience wrappers around a call to `dvl.register`.

```javascript
var a = dvl(5);
var b = dvl(12);
var c = dvl();

dvl.register({
	listen: [a, b],
	change: [c],
	fn: function() {
		var _a = a.value();
		var _b = b.value();
		if (_a !== null && _b !== null) {
			c.value(Math.sqrt(_a * _a + _b * _b));
		} else {
			c.value(null);
		}
	}
});

console.log(c.value()); //=> 13

a.value(3);
b.value(4);
console.log(c.value()); //=> 5
```

The above example is equivalent to the first `dvl.apply` example.

We must explicitly declare that the function being `register`ed will be changing `c`. This is important for DVL to calculate the dependency graph and ensure that it is acyclic. Modifying a variable without specifying that it might be modified will throw an error.

## Credits

[Vadim Ogievetsky](http://vadim.ogievetsky.com)

[Barret Schloerke](http://github.com/schloerke)

With invaluable advice from [Mike Bostock](http://bost.ocks.org/mike/)



# DVL

**DVL** is a free functionally reactive library written in JavaScript. DVL is based on the idea that code should automaticity be run when the variables that it depends on change.

DVL consists of three parts:
DVL core – The DVL event dispatcher and miscellaneous helper utilities.
DVL SVG – A collection of functions written on top of  [D3](http://mbostock.github.com/d3/) to allow for dynamic visualization with SVG.
DVL HTML – A collection of functions written on top of  [D3](http://mbostock.github.com/d3/) and jQuery for creating dynamic HTML components.

The code DVL functionality can be described with the following functions:

**dvl.def**

Creates a wrapped variable that can dispatch events.

		var x = dvl.def(5);
		x.get(); //== 5
		x.set(7);
		x.get(); //== 7
		
creates a wrapped DVL variable with an initial value of 5. This value can be modified through x.get() and x.set(7). To announce to the rest of the program that x has changed x.notify() can be called.

**dvl.register**

Registers a function to be called whenever any of the registered listened to objects change as well as announcing what objects the function might modify.

		var a = dvl.def(3);
		var b = dvl.def(4);
		var c = dvl.def(null);

		function calc() {
			var av = a.get();
			var bv = b.get();
			c.set(Math.sqrt(av*av + bv*bv));
			c.notify();
		}

		dvl.register({
			fn: calc,
			listen: [a, b],
			change: [c]
		})

		c.get() //== 5

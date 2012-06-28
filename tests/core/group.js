var dvl = require("../../dvl");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("dvl.group");

suite.addBatch({
  "basic group": {
    topic: function() {
      var t = {
        runs: 0,
        a: dvl(1),
        b: dvl(2),
        set: function(x) {
          t.a.value(x)
          t.b.value(x)
        }
      };

      dvl.register({
        listen: [t.a, t.b],
        fn: function() {
          t.runs++;
        }
      });

      return t;
    },

    "no group 2 calls": function(t) {
      t.runs = 0;
      t.set(10);
      assert.strictEqual(t.runs, 2);
    },

    "with group 1 call": function(t) {
      t.runs = 0;
      dvl.group(t.set)(20);
      assert.strictEqual(t.runs, 1);
    },

    "with group but same value": function(t) {
      t.runs = 0;
      dvl.group(t.set)(20);
      assert.strictEqual(t.runs, 0);
    },
  },
});


suite.export(module);
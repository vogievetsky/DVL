var dvl = require("../../dvl");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("dvl.apply");

suite.addBatch({
  "basic apply": {
    topic: function() {
      var t = {
        runs: 0,
        a: dvl(3).name('a'),
        invalid: dvl(10)
      }

      t.b = dvl.apply({
        args: [t.a],
        fn: function(a) {
          t.runs++;
          return a * 7;
        },
        invalid: t.invalid
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 1);
      assert.strictEqual(t.b.value(), 21);
    },

    "correct next run": function(t) {
      t.a.value(4)
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.value(), 28);
    },

    "correct invalid": function(t) {
      t.a.value(null)
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.value(), 10);
    },

    "correct on invalid change": function(t) {
      t.invalid.value(20)
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.value(), 20);
    },
  },
});

suite.addBatch({
  "extreme apply": {
    topic: function() {
      var t = {
        runs: 0
      }

      missing = [][1]

      t.a = dvl.apply(missing, function(a) {
        t.runs++;
        return String(a);
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 0);
      assert.strictEqual(t.a.value(), null);
    }
  },
});

suite.export(module);

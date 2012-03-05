var dvl = require("../../dvl");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("dvl.register");

suite.addBatch({
  "basic register": {
    topic: function() {
      var t = {
        runs: 0,
        a: dvl.def(3).name('a')
      }

      dvl.register({
        listen: [t.a],
        fn: function() {
          t.runs++;
        }
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 1);
    },

    "correct next run": {
      "next run": function(t) {
        t.a.set(4).notify();
        assert.strictEqual(t.runs, 2);
      }
    }
  },


  "basic register / no run": {
    topic: function() {
      var t = {
        runs: 0,
        a: dvl.def(3).name('a')
      }

      dvl.register({
        listen: [t.a],
        noRun: true,
        fn: function() {
          t.runs++;
        }
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 0);
    },

    "correct next run": {
      "next run": function(t) {
        t.a.set(4).notify();
        assert.strictEqual(t.runs, 1);
      }
    }
  },


  "change and listen register": {
    topic: function() {
      var t = {
        runs: 0,
        a: dvl.def(3).name('a'),
        b: dvl.def(null).name('b')
      }

      dvl.register({
        listen: [t.a],
        change: [t.b],
        fn: function() {
          t.b.set(t.a.get() * 5).notify();
          t.runs++;
        }
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 1);
      assert.strictEqual(t.b.get(), 15);
    },

    "correct next run": {
      "next run": function(t) {
        t.a.set(4).notify();
        assert.strictEqual(t.runs, 2);
        assert.strictEqual(t.b.get(), 20);
      }
    }
  },
});

suite.export(module);

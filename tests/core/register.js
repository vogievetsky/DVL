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
        fn: function() { t.runs++; }
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 1);
    },

    "correct next run / dvl.notify()": function(t) {
      t.a.set(4);
      dvl.notify(t.a);
      assert.strictEqual(t.runs, 2);
    },

    "correct next run / a.set(_).notify()": function(t) {
      t.a.set(4).notify();
      assert.strictEqual(t.runs, 3);
    },

    "correct next run / a.notify()": function(t) {
      t.a.notify();
      assert.strictEqual(t.runs, 4);
    },
  },


  "basic register / const": {
    topic: function() {
      var t = {
        runs: 0,
        a: dvl.const(3).name('a')
      }

      dvl.register({
        listen: [t.a],
        fn: function() { t.runs++; }
      });

      return t;
    },

    "always unchaged": function(t) {
      assert.strictEqual(t.runs, 1);

      t.a.set(4);
      dvl.notify(t.a);
      assert.strictEqual(t.runs, 1);

      t.a.set(4).notify();
      assert.strictEqual(t.runs, 1);

      t.a.notify();
      assert.strictEqual(t.runs, 1);
    },
  },


  "basic register / no init run": {
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

    "correct next run": function(t) {
      t.a.set(4).notify();
      assert.strictEqual(t.runs, 1);
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

    "correct next run": function(t) {
      t.a.set(4).notify();
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.get(), 20);
    }
  },


  "circular register": {
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

    "cant make circular": function(t) {
      assert.throws(function() {
        dvl.register({
          listen: [t.b],
          change: [t.a],
          fn: function() { "whatever" }
        });
      });
    },
  },
});

suite.export(module);

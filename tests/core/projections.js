var dvl = require("../../dvl");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("dvl.project");

suite.addBatch({
  "basic register / no init run": {
    topic: function() {
      dvl.clearAll();
      var t = {
        color: dvl().compare(false),
      }
      t.r = t.color.project({
        down: function(c) { return c.r },
        up:   function(r) { this.r = r; return this }
      })

      t.avg = t.color.apply(function(a) { return (a.r + a.g + a.b) / 3; })

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.r.value(), null);
    },

    "correct to": function(t) {
      t.color.value({ r: 1, g: 2, b: 3 });
      assert.strictEqual(t.r.value(), 1);
    },

    "correct from": function(t) {
      t.r.value(10);
      assert.strictEqual(t.color.value().r, 10);
    },

    "correct notify": function(t) {
      t.r.value(10);
      assert.strictEqual(t.avg.value(), 5);
    }
  },
});

suite.addBatch({
  "dynamic projection": {
    topic: function() {
      dvl.clearAll();
      var t = {
        key: dvl(),
        color: dvl().compare(false),
      }
      var projFns = dvl.apply(t.key, function(_key) {
        return {
          down: function(c) { return c[_key] },
          up:   function(r) { this[_key] = r; return this }
        }
      })
      t.r = t.color.project(projFns)

      t.rCopy = t.r.apply(dvl.identity)

      t.avg = t.color.apply(function(a) { return (a.r + a.g + a.b) / 3; })

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.r.value(), null);
    },

    "correct still null": function(t) {
      t.color.value({ r: 1, g: 2, b: 3 });
      assert.strictEqual(t.r.value(), null);
    },

    "correct to": function(t) {
      t.key.value('r')
      assert.strictEqual(t.r.value(), 1);
    },

    "correct from": function(t) {
      t.r.value(10);
      assert.strictEqual(t.color.value().r, 10);
    },

    "correct notify": function(t) {
      t.r.value(10);
      assert.strictEqual(t.rCopy.value(), 10);
      assert.strictEqual(t.avg.value(), 5);
    },

    "correct on change": function(t) {
      t.key.value('g')
      assert.strictEqual(t.r.value(), 2);
    }
  },
});

suite.export(module);

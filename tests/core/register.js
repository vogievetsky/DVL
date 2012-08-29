var dvl = require("../../dvl");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("dvl.register");

suite.addBatch({
  "basic register": {
    topic: function() {
      dvl.clearAll();
      var t = {
        runs: 0,
        a: dvl(3)
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

    "correct next run": function(t) {
      t.a.value(4);
      assert.strictEqual(t.runs, 2);
    },

    "correct next run / same value": function(t) {
      t.a.value(4);
      assert.strictEqual(t.runs, 2);
    },

    "correct next run / notify": function(t) {
      t.a.notify();
      assert.strictEqual(t.runs, 3);
    },
  },
});

suite.addBatch({
  "basic register / const": {
    topic: function() {
      dvl.clearAll();
      var t = {
        runs: 0,
        a: dvl.const(3)
      }

      dvl.register({
        listen: [t.a],
        fn: function() { t.runs++; }
      });

      return t;
    },

    "always unchaged": function(t) {
      assert.strictEqual(t.runs, 1);

      t.a.value(4);
      assert.strictEqual(t.runs, 1);

      t.a.notify();
      assert.strictEqual(t.runs, 1);
    },
  },
});

suite.addBatch({
  "basic register / no init run": {
    topic: function() {
      dvl.clearAll();
      var t = {
        runs: 0,
        a: dvl(3)
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
      t.a.value(4);
      assert.strictEqual(t.runs, 1);
    }
  },
});

suite.addBatch({
  "change and listen register": {
    topic: function() {
      dvl.clearAll();
      var t = {
        runs: 0,
        a: dvl(3),
        b: dvl()
      }

      dvl.register({
        listen: [t.a],
        change: [t.b],
        fn: function() {
          t.b.value(t.a.value() * 5).notify();
          t.runs++;
        }
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 1);
      assert.strictEqual(t.b.value(), 15);
    },

    "correct next run": function(t) {
      t.a.value(4);
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.value(), 20);
    }
  },
});

suite.addBatch({
  "double link": {
    topic: function() {
      dvl.clearAll();
      var t = {
        runs: 0,
        a: dvl(3),
        b1: dvl(),
        b2: dvl()
      }

      dvl.register({
        listen: [t.a],
        change: [t.b1, t.b2],
        fn: function() {
          t.b1.value(t.a.value() * 4)
          t.b2.value(t.a.value() * 5)
        }
      });

      var c = dvl();
      dvl.register({
        listen: [c],
        fn: function() {}
      })

      dvl.register({
        listen: [t.b1, t.b2],
        change: [c],
        fn: function() {
          t.runs++
        }
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 1);
    },

    "correct next run": function(t) {
      t.a.value(4);
      assert.strictEqual(t.runs, 2);
    }
  },
});

suite.addBatch({
  "hasChanged works": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        b: dvl(4),
        c: dvl.const(5),
        status: ''
      }

      dvl.register({
        listen: [t.a, t.b, t.c],
        fn: function() {
          if (t.a.hasChanged()) t.status += 'A';
          if (t.b.hasChanged()) t.status += 'B';
          if (t.c.hasChanged()) t.status += 'C';
        }
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.status, 'ABC');
    },

    "correct next run on a": function(t) {
      t.status = '';
      t.a.value(13);
      assert.strictEqual(t.status, 'A');
    },

    "correct next run on b": function(t) {
      t.status = '';
      t.b.value(14);
      assert.strictEqual(t.status, 'B');
    },
  },
});

suite.addBatch({
  "circular register": {
    topic: function() {
      dvl.clearAll();
      var t = {
        runs: 0,
        a: dvl(3),
        b: dvl(null)
      }

      dvl.register({
        listen: [t.a],
        change: [t.b],
        fn: function() {
          t.b.value(t.a.value() * 5).notify();
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


suite.addBatch({
  "addListen": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        b: dvl(4),
        status: ''
      }

      t.f = dvl.register({ listen: t.a, fn: function() { t.status += 'A' } });
      return t;
    },

    "correct init run": function(t) {
      assert.strictEqual(t.status, 'A');
    },

    "correct pre add a change": function(t) {
      t.status = '';
      t.a.notify()
      assert.strictEqual(t.status, 'A');
    },

    "correct pre add b change": function(t) {
      t.status = '';
      t.b.notify()
      assert.strictEqual(t.status, '');
    },

    "correct add b": function(t) {
      t.status = '';
      t.f.addListen(t.b)
      assert.strictEqual(t.status, 'A');
    },

    "correct post add a change": function(t) {
      t.status = '';
      t.a.notify()
      assert.strictEqual(t.status, 'A');
    },

    "correct post add b change": function(t) {
      t.status = '';
      t.b.notify()
      assert.strictEqual(t.status, 'A');
    },
  },
});



suite.addBatch({
  "addChange": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        b: dvl(3),
        changes: [],
        status: ''
      }

      t.f = dvl.register({
        listen: t.a,
        fn: function() { t.status += 'A'; dvl.notify.apply(null, t.changes); }
      });

      dvl.register({
        listen: t.b,
        fn: function() { t.status += 'B' }
      });
      return t;
    },

    "correct init run": function(t) {
      assert.strictEqual(t.status, 'AB');
    },

    "correct pre add a change": function(t) {
      t.status = '';
      t.a.notify();
      assert.strictEqual(t.status, 'A');
    },

    "correct add b": function(t) {
      t.status = '';
      t.f.addChange(t.b);
      t.changes.push(t.b);
      assert.strictEqual(t.status, '');
    },

    "correct post add a change": function(t) {
      t.status = '';
      t.a.notify()
      assert.strictEqual(t.status, 'AB');
    },
  },
});


suite.addBatch({
  "remove basic": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        status: ''
      }

      t.f = dvl.register({
        listen: t.a,
        fn: function() { t.status += 'A'; }
      });

      return t;
    },

    "correct init run": function(t) {
      assert.strictEqual(t.status, 'A');
    },

    "correct pre remove": function(t) {
      t.status = '';
      t.a.notify();
      assert.strictEqual(t.status, 'A');
    },

    "correct post remove": function(t) {
      t.status = '';
      t.f.discard();
      t.a.notify();
      assert.strictEqual(t.status, '');
    },
  },
});



suite.addBatch({
  "register order preserved - 1": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        status: ''
      }

      dvl.register({ listen: t.a, fn: function() { t.status += 'A' } });
      dvl.register({ listen: t.a, fn: function() { t.status += 'B' } });
      dvl.register({ listen: t.a, fn: function() { t.status += 'C' } });

      return t;
    },

    "correct init run": function(t) {
      assert.strictEqual(t.status, 'ABC');
    },

    "correct next run": function(t) {
      t.status = '';
      t.a.notify()
      assert.strictEqual(t.status, 'ABC');
    },
  },
});

suite.addBatch({
  "register order preserved - 2": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        b: dvl(3),
        status: ''
      }

      dvl.register({ listen: t.a, fn: function() { t.status += 'A' } });
      dvl.register({ listen: t.b, fn: function() { t.status += 'B' } });
      dvl.register({ listen: t.a, fn: function() { t.status += 'C' } });

      return t;
    },

    "correct init run": function(t) {
      assert.strictEqual(t.status, 'ABC');
    },

    "correct next run": function(t) {
      t.status = '';
      dvl.notify(t.a, t.b)
      assert.strictEqual(t.status, 'ABC');
    },
  },
});

suite.addBatch({
  "register order preserved - 3": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        b: dvl(3),
        status: ''
      }

      dvl.register({
        listen: t.a,
        change: t.b,
        fn: function() { t.status += 'A'; t.b.notify() }
      });

      dvl.register({
        listen: [t.a, t.b],
        fn: function() { t.status += 'B' }
      });

      return t;
    },

    "correct init run": function(t) {
      assert.strictEqual(t.status, 'AB');
    },

    "correct next run": function(t) {
      t.status = '';
      dvl.notify(t.a)
      assert.strictEqual(t.status, 'AB');
    },
  },
});

suite.addBatch({
  "register order preserved - 4": {
    topic: function() {
      dvl.clearAll();
      var t = {
        a: dvl(3),
        b: dvl(5),
        status: ''
      }

      dvl.register({ listen: [t.a], change: [t.b], fn: function() {
        t.b.notify();
        t.status += '&';
      }});

      dvl.register({ listen: [t.b], fn: function() { t.status += 'A' } });
      dvl.register({ listen: [t.a], fn: function() { t.status += 'B' } });
      dvl.register({ listen: [t.b], fn: function() { t.status += 'C' } });

      return t;
    },

    "correct init run": function(t) {
      assert.strictEqual(t.status, '&ABC');
    },

    "correct next run": function(t) {
      t.status = '';
      t.a.notify()
      assert.strictEqual(t.status, '&ABC');
    },
  },
});

suite.addBatch({
  "register order preserved - 5": {
    topic: function() {
      dvl.clearAll();
      var t = {
        source: dvl(1),
        status: ''
      };

      var bp = t.source.apply(dvl.identity);
      var dp = dvl();

      dvl.register({
        listen: [t.source],
        fn: function() {
          t.status += 'A';
        }
      });

      dvl.register({
        listen: [t.source, bp],
        fn: function() {
          t.status += 'B';
        }
      });

      dvl.register({
        listen: [t.source],
        fn: function() {
          t.status += 'C';
        }
      });

      dvl.register({
        listen: [t.source],
        change: [dp],
        fn: function() {
          t.status += 'D';
          dp.value(t.source.value());
        }
      });

      dvl.register({
        listen: [t.source],
        fn: function() {
          t.status += 'E';
        }
      });

      dvl.register({
        listen: [dp],
        fn: function() {
          t.status += '#';
        }
      });

      return t;
    },

    "correct run": function(t) {
      t.status = '';
      t.source.value(2);
      assert.strictEqual(t.status, 'ABCDE#');
    },
  },
});

suite.export(module);

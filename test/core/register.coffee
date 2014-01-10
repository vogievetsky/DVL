chai = require("chai")
expect = chai.expect
dvl = require("../../src")


describe "dvl.register", ->

  describe "basic register", ->
    runs = 0
    a = dvl(3)

    dvl.register {
      listen: a
      fn: -> runs++
    }

    it "correct initial run", ->
      expect(runs).to.equal(1)

    it "correct next run", ->
      a.value(4)
      expect(runs).to.equal(2)

    it "correct next run / same value", ->
      a.value(4)
      expect(runs).to.equal(2)

    it "correct next run / notify", ->
      a.notify()
      expect(runs).to.equal(3)

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "basic register / const", ->
    runs = 0
    a = dvl.const(3)

    dvl.register {
      listen: a
      fn: -> runs++
    }

    it "always unchaged", ->
      expect(runs).to.equal(1)

      a.value(4)
      expect(runs).to.equal(1)

      a.notify()
      expect(runs).to.equal(1)

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "basic register / no init run", ->
    runs = 0
    a = dvl(3)

    dvl.register {
      listen: a
      noRun: true
      fn: -> runs++
    }

    it "correct initial run", ->
      expect(runs).to.equal(0)

    it "correct next run", ->
      a.value(4)
      expect(runs).to.equal(1)

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "change and listen register", ->
    runs = 0
    a = dvl(3)
    b = dvl()

    dvl.register {
      listen: a
      change: b
      fn: ->
        b.value(a.value() * 5)
        runs++
    }

    it "correct initial run", ->
      expect(runs).to.equal(1)
      expect(b.value()).to.equal(15)

    it "correct next run", ->
      a.value(4)
      expect(runs).to.equal(2)
      expect(b.value()).to.equal(20)

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "double link", ->
    runs = 0
    a = dvl(3)
    b1 = dvl()
    b2 = dvl()

    dvl.register {
      listen: a
      change: [b1, b2]
      fn: ->
        b1.value(a.value() * 4)
        b2.value(a.value() * 5)
    }

    c = dvl()
    dvl.register {
      listen: c
      fn: -> "dummy"
    }

    dvl.register {
      listen: [b1, b2]
      change: c
      fn: -> runs++
    }

    it "correct initial run", ->
      expect(runs).to.equal(1)

    it "correct next run", ->
      a.value(4)
      expect(runs).to.equal(2)

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "hasChanged works", ->
    a = dvl(3)
    b = dvl(4)
    c = dvl.const(5)
    status = ''

    dvl.register {
      listen: [a, b, c]
      fn: ->
        status += 'A' if a.hasChanged()
        status += 'B' if b.hasChanged()
        status += 'C' if c.hasChanged()
    }

    it "correct initial run", ->
      expect(status).to.equal('ABC')

    it "correct next run on a", ->
      status = ''
      a.value(13)
      expect(status).to.equal('A')

    it "correct next run on b", ->
      status = ''
      b.value(14)
      expect(status).to.equal('B')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "addListen", ->
    a = dvl(3)
    b = dvl(4)
    status = ''

    f = dvl.register {
      listen: a
      fn: -> status += 'A'
    }

    it "correct init run", ->
      expect(status).to.equal('A')

    it "correct pre add a change", ->
      status = ''
      a.notify()
      expect(status).to.equal('A')

    it "correct pre add b change", ->
      status = ''
      b.notify()
      expect(status).to.equal('')

    it "correct add b", ->
      status = ''
      f.addListen(b)
      expect(status).to.equal('A')

    it "correct post add a change", ->
      status = ''
      a.notify()
      expect(status).to.equal('A')

    it "correct post add b change", ->
      status = ''
      b.notify()
      expect(status).to.equal('A')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "addChange", ->
    a = dvl(3)
    b = dvl(3)
    changes = []
    status = ''

    f = dvl.register {
      listen: a
      fn: ->
        status += 'A'
        dvl.notify.apply(dvl.notify, changes)
    }

    dvl.register {
      listen: b
      fn: -> status += 'B'
    }

    it "correct init run", ->
      expect(status).to.equal('AB')

    it "correct pre add a change", ->
      status = ''
      a.notify()
      expect(status).to.equal('A')

    it "correct add b", ->
      status = ''
      f.addChange(b)
      changes.push(b)
      expect(status).to.equal('')

    it "correct post add a change", ->
      status = ''
      a.notify()
      expect(status).to.equal('AB')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "remove basic", ->
    a = dvl(3)
    status = ''

    f = dvl.register {
      listen: a
      fn: -> status += 'A'
    }

    it "correct init run", ->
      expect(status).to.equal('A')

    it "correct pre remove", ->
      status = ''
      a.notify()
      expect(status).to.equal('A')

    it "correct post remove", ->
      status = ''
      f.discard()
      a.notify()
      expect(status).to.equal('')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "register order preserved - 1", ->
    a = dvl(3)
    status = ''

    dvl.register({ listen: a, fn: -> status += 'A' })
    dvl.register({ listen: a, fn: -> status += 'B' })
    dvl.register({ listen: a, fn: -> status += 'C' })

    it "correct init run", ->
      expect(status).to.equal('ABC')

    it "correct next run", ->
      status = ''
      a.notify()
      expect(status).to.equal('ABC')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "register order preserved - 2", ->
    a = dvl(3)
    b = dvl(3)
    status = ''

    dvl.register({ listen: a, fn: -> status += 'A' })
    dvl.register({ listen: b, fn: -> status += 'B' })
    dvl.register({ listen: a, fn: -> status += 'C' })

    it "correct init run", ->
      expect(status).to.equal('ABC')

    it "correct next run", ->
      status = ''
      dvl.notify(a, b)
      expect(status).to.equal('ABC')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "register order preserved - 3", ->
    a = dvl(3)
    b = dvl(3)
    status = ''

    dvl.register {
      listen: a,
      change: b,
      fn: ->
        status += 'A'
        b.notify()
    }

    dvl.register {
      listen: [a, b]
      fn: -> status += 'B'
    }

    it "correct init run", ->
      expect(status).to.equal('AB')

    it "correct next run", ->
      status = ''
      dvl.notify(a)
      expect(status).to.equal('AB')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "register order preserved - 4", ->
    a = dvl(3)
    b = dvl(5)
    status = ''

    dvl.register {
      listen: a
      change: b
      fn: ->
        b.notify()
        status += '&'
    }

    dvl.register({ listen: b, fn: -> status += 'A' })
    dvl.register({ listen: a, fn: -> status += 'B' })
    dvl.register({ listen: b, fn: -> status += 'C' })

    it "correct init run", ->
      expect(status).to.equal('&ABC')

    it "correct next run", ->
      status = ''
      a.notify()
      expect(status).to.equal('&ABC')

    it "maintains graph consistency", ->
      expect(dvl.sortGraph).not.to.throw()


  describe "register order preserved - 5", ->
    source = dvl(1)
    status = ''

    bp = source.apply(dvl.identity)
    dp = dvl()

    dvl.register {
      listen: source
      fn: -> status += 'A'
    }

    dvl.register {
      listen: [source, bp]
      fn: -> status += 'B'
    }

    dvl.register {
      listen: source
      fn: -> status += 'C'
    }

    dvl.register {
      listen: source
      change: dp
      fn: ->
        status += 'D'
        dp.value(source.value())
    }

    dvl.register {
      listen: source
      fn: -> status += 'E'
    }

    dvl.register {
      listen: dp
      fn: -> status += '#'
    }

    it "correct run", ->
      status = ''
      source.value(2)
      expect(status).to.equal('ABCDE#')



describe "dvl.register errors", ->
  describe "circular register", ->
    runs = 0
    a = dvl(3)
    b = dvl(null)

    dvl.register {
      listen: a
      change: b
      fn: ->
        b.value(a.value() * 5)
        runs++
    }

    it "cant make circular", ->
      expect(->
        dvl.register {
          listen: b
          change: a
          fn: -> "whatever"
        }
      ).to.throw(Error)

    it "maintains graph consistency", ->
      dvl.clearAll()
      expect(dvl.sortGraph).not.to.throw()


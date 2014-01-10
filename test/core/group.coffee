chai = require("chai")
expect = chai.expect
dvl = require("../../src")

describe "dvl.group", ->

  describe "basic group", ->
    runs = 0
    a = dvl(1)
    b = dvl(2)

    setValues = (x) ->
      a.value(x)
      b.value(x)
      return

    dvl.register {
      listen: [a, b]
      fn: -> runs++
    }

    it "no group 2 calls", ->
      runs = 0
      setValues(10)
      expect(runs).to.equal(2)

    it "with group 1 call", ->
      runs = 0
      dvl.group(setValues)(20)
      expect(runs).to.equal(1)

    it "with group but same value", ->
      runs = 0
      dvl.group(setValues)(20)
      expect(runs).to.equal(0)

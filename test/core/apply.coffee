chai = require("chai")
expect = chai.expect
dvl = require("../../src")

describe "dvl.apply", ->

  describe "basic apply", ->
    runs = 0
    a = dvl(3)
    invalid = dvl(10)

    b = dvl.apply {
      args: a
      fn: (a) ->
        runs++
        return a * 7
      invalid: invalid
    }

    it "correct initial run", ->
      expect(runs).to.equal(1)
      expect(b.value()).to.equal(21)

    it "correct next run", ->
      a.value(4)
      expect(runs).to.equal(2)
      expect(b.value()).to.equal(28)

    it "correct invalid", ->
      a.value(null)
      expect(runs).to.equal(2)
      expect(b.value()).to.equal(10)

    it "correct on invalid change", ->
      invalid.value(20)
      expect(runs).to.equal(2)
      expect(b.value()).to.equal(20)


  describe "extreme apply", ->
    runs = 0
    missing = [][1]

    a = dvl.apply missing, (a) ->
      runs++
      return String(a)

    it "correct initial run", ->
      expect(runs).to.equal(0)
      expect(a.value()).to.equal(null)


chai = require("chai")
expect = chai.expect
dvl = require("../../src")

describe "dvl basics", ->

  describe "constants", ->
    it "returns the correct init value on nothing", ->
      v = dvl.const()
      expect(v.value()).to.equal(null)

    it "returns the correct init value on undefined", ->
      v = dvl.const(undefined)
      expect(v.value()).to.equal(null)

    it "returns the correct init value on null", ->
      v = dvl.const(null)
      expect(v.value()).to.equal(null)

    it "returns the correct init value", ->
      v = dvl.const(5)
      expect(v.value()).to.equal(5)


    it "returns the correct set value on undefined", ->
      v = dvl.const(3).value(undefined)
      expect(v.value()).to.equal(3)

    it "returns the correct set value on null", ->
      v = dvl.const(3).value(null)
      expect(v.value()).to.equal(3)

    it "returns the correct set value", ->
      v = dvl.const(3).value(5)
      expect(v.value()).to.equal(3)

    it "returns the correct set value on NaN", ->
      v = dvl.const(3).value(NaN)
      expect(v.value()).to.equal(3)


    it "set to nothing does nothing", ->
      v = dvl.const(3)
      v.value()
      expect(v.value()).to.equal(3)


    it "no initial name", ->
      v = dvl.const(3)
      expect(v.name()).to.equal('<anon_const>')

    it "setting name", ->
      v = dvl.const(3).name("some_name")
      expect(v.name()).to.equal("some_name")


  describe "variables", ->
    it "returns the correct init value on nothing", ->
      v = dvl()
      expect(v.value()).to.equal(null)

    it "returns the correct init value on undefined", ->
      v = dvl(undefined)
      expect(v.value()).to.equal(null)

    it "returns the correct init value on null", ->
      v = dvl(null)
      expect(v.value()).to.equal(null)

    it "returns the correct init value", ->
      v = dvl(5)
      expect(v.value()).to.equal(5)

    it "returns the correct set value on undefined", ->
      v = dvl().value(undefined)
      expect(v.value()).to.equal(null)

    it "returns the correct set value on null", ->
      v = dvl().value(null)
      expect(v.value()).to.equal(null)

    it "returns the correct set value", ->
      v = dvl().value(5)
      expect(v.value()).to.equal(5)

    it "returns the correct set value on NaN", ->
      v = dvl().value(NaN)
      expect(isNaN(v.value())).to.be.true


    it "no initial name", ->
      v = dvl(5)
      expect(v.name()).to.equal('<anon>')

    it "setting name", ->
      v = dvl(5).name("some_name")
      expect(v.name()).to.equal("some_name")


  describe "compare variables", ->
    runs = 0
    a = dvl([]).compare(false)

    dvl.register {
      listen: a
      fn: -> runs++
    }

    _a = a.value()
    _a.push(1)
    a.value(_a)

    it "has notified", ->
      expect(runs).to.equal(2)


  describe "lazy variables", ->
    it "returns the correct value form lazy", ->
      v = dvl()
      v.lazyValue(-> 3)
      expect(v.value()).to.equal(3)





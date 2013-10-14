chai = require("chai")
expect = chai.expect
dvl = require("../../dvl")

describe "dvl.project", ->

  describe "basic register / no init run", ->
    color = dvl().compare(false)

    red = color.project {
      down: (c) -> c.r
      up: (r) ->
        this.r = r
        return this
    }

    avg = color.apply(({r, g, b}) -> (r + g + b) / 3)

    it "correct initial run", ->
      expect(red.value()).to.equal(null)


    it "correct to", ->
      color.value({ r: 1, g: 2, b: 3 })
      expect(red.value()).to.equal(1)


    it "correct from", ->
      red.value(10)
      expect(color.value().r).to.equal(10)


    it "correct notify", ->
      red.value(10)
      expect(avg.value()).to.equal(5)


  describe "dynamic projection", ->
    key = dvl()
    color = dvl().compare(false)

    projFns = dvl.apply(key, (_key) ->
      return {
        down: (c) -> c[_key]
        up: (r) ->
          this[_key] = r
          return this
      }
    )

    r = color.project(projFns)

    rChanged = false
    dvl.register {
      listen: r
      fn: -> rChanged = r.hasChanged()
    }

    rCopy = r.apply(dvl.identity)
    avg = color.apply(({r, g, b}) -> (r + g + b) / 3)


    it "correct initial run", ->
      expect(r.value()).to.equal(null)


    it "correct still null", ->
      color.value({ r: 1, g: 2, b: 3 })
      expect(r.value()).to.equal(null)


    it "correct to", ->
      key.value('r')
      expect(r.value()).to.equal(1)


    it "correct from", ->
      r.value(10)
      expect(color.value().r).to.equal(10)


    it "correct notify", ->
      r.value(10)
      expect(rCopy.value()).to.equal(10)
      expect(avg.value()).to.equal(5)


    it "correct on change", ->
      key.value('g')
      expect(r.value()).to.equal(2)


    it "correct hasChanged", ->
      color.value({ r: 31, g: 32, b: 33 })
      expect(rChanged).to.equal(true)


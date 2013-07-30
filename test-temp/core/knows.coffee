chai = require("chai")
expect = chai.expect
dvl = require("../../dvl")

describe "dvl.knows", ->

  it "knows variables", ->
    v = dvl(2)
    expect(dvl.knows(v)).to.equal(true)


  it "knows constants", ->
    c = dvl.const(4)
    expect(dvl.knows(c)).to.equal(true)


  it "doesn't know regulars", ->
    c = 'poo'
    expect(dvl.knows(c)).to.equal(false)


  it "doesn't know nulls", ->
    c = null
    expect(dvl.knows(c)).to.equal(false)


  it "doesn't know unedefined", ->
    c = undefined
    expect(dvl.knows(c)).to.equal(false)


  it "doesn't know fake variables", ->
    v = dvl(2)
    vFake = {}
    for own key, value of v
      vFake[key] = value
    expect(dvl.knows(vFake)).to.equal(false)


  it "doesn't know fake constants", ->
    c = dvl.const(4)
    cFake = {}
    for own key, value of c
      cFake[key] = value
    expect(dvl.knows(cFake)).to.equal(false)


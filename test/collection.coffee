{ expect } = require 'chai'
d3 = require 'd3'
jsdom = require 'jsdom'

dvl = require '../src'

describe 'dvl.collection', ->
  docs = null
  beforeEach ->
    doc = jsdom.jsdom("<html><body></body></html>", jsdom.level(1, "core"))

  afterEach ->
    doc = jsdom.jsdom("<html><body></body></html>", jsdom.level(1, "core"))

  it 'initializes correctly with one argument', ->
    data = dvl([1, 2, 3])
    collection = dvl.collection({
      data
      serialize: (number) -> String(number)
      fn: (number) ->
        a = number.apply((_number) -> _number + 5)
        b = number.apply((_number) -> _number / 5)
    })
    expect(collection._data).to.equal(data)

  it 'initializes correctly with two arguments', ->
    data = dvl([1, 2, 3])
    collection = dvl.collection(data, (number) ->
      a = number.apply((_number) -> _number + 5)
      b = number.apply((_number) -> _number / 5)
    )
    expect(collection._data).to.equal(data)

  it 'adds members without errors', (done) ->
    data = dvl([1])

    pointers = {}
    counter = 0

    collection = dvl.collection(data, (number) ->
      a = number.apply((_number) -> _number + 5)
      pointers[number.value()] = a
      counter += 1
    )

    setTimeout(->
      test = {
        1: pointers[1]
      }
      expect(counter).to.equal(1)
      data.value([1, 2])

      setTimeout(->
        expect(pointers[1]).to.equal(test[1])
        expect(pointers[2].value()).to.equal(7)
        expect(counter).to.equal(2)
        done()
      , 0)
    , 0)

  it 'correctly executes the block', (done) ->
    data = dvl([1])
    externalVariable = dvl()
    collection = dvl.collection(data, (number) ->
      dvl.register {
        listen: number
        change: externalVariable
        fn: ->
          externalVariable.value(number.value())
      }
    )
    expect(collection._data).to.equal(data)
    setTimeout(->
      expect(externalVariable.value()).to.equal(1)
      data.value([2])

      setTimeout(->
        expect(externalVariable.value()).to.equal(2)
        data.value([10])

        setTimeout(->
          expect(externalVariable.value()).to.equal(10)
          done()
        , 0)
      , 0)
    , 0)

  it 'appends the element correctly without destroying original element', (done) ->
    data = dvl([0, 1])
    collection = dvl.collection(data, (number) ->
      dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum: number
        text: String
        attr: {
          class: -> return Math.floor(Math.random() * 10000)
        }
      }
    )
    setTimeout(->
      firstDivs = {}
      divs = d3.select('body').selectAll('div')
      divs.each((d, i) ->
        expect(d).to.equal(i)
        firstDivs[i] = this
      )
      expect(divs.size()).to.equal(2)
      data.value([0, 1, 2])

      setTimeout(->
        divs = d3.select('body').selectAll('div')
        divs.each((d, i) ->
          expect(d).to.equal(i)
          if i < 2
            expect(this).to.equal(firstDivs[i])
        )
        expect(divs.size()).to.equal(3)
        done()
      , 0)
    , 0)

  it.only 'removes the element correctly without destroying original element', (done) ->
    data = dvl([0, 1, 2])
    collection = dvl.collection(data, (number) ->
      dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum: number
        text: String
      }
    )
    setTimeout(->
      firstDivs = {}
      divs = d3.select('body').selectAll('div')
      divs.each((d, i) ->
        expect(d).to.equal(i)
        firstDivs[i] = this
      )
      expect(divs.size()).to.equal(3)
      data.value([0, 1])

      setTimeout(->
        divs = d3.select('body').selectAll('div')
        divs.each((d, i) ->
          expect(d).to.equal(i)
          expect(this).to.equal(firstDivs[i])
        )
        expect(divs.size()).to.equal(2)
        done()
      , 0)
    , 0)


  it 'order the element correctly', (done) ->
    data = dvl([1, 2])
    collection = dvl.collection(data, (number) ->
      dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum: number
        text: String
      }
    )
    setTimeout(->
      console.log d3.select('body').html()
      data.value([2, 1])

      setTimeout(->
        console.log d3.select('body').html()
        done()
      , 0)
    , 0)



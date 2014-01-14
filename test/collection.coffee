{ expect } = require 'chai'
d3 = require 'd3'

dvl = require '../src'

verifyCleanState = -> throw new Error('Body is not empty') unless d3.select('body').selectAll('div').size() is 0
cleanUp = ->
  dvl.clearAll()
  d3.select('body').selectAll('div').remove()

describe 'dvl.collection', ->
  beforeEach verifyCleanState
  afterEach cleanUp

  it 'adds members without errors', (done) ->
    data = dvl([0])
    counter = 0

    collection = dvl.collection(data, (number) ->
      dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum: number
        text: String
      }
      counter += 1
    )

    process.nextTick(->
      expect(counter).to.equal(1)
      data.value([0, 1])

      process.nextTick(->
        divs = d3.select('body').selectAll('div')
        expect(divs.size()).to.equal(2)
        divs.each((d, i) ->
          expect(d).to.equal(i)
        )
        done()
      )
    )

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
    process.nextTick(->
      expect(externalVariable.value()).to.equal(1)
      data.value([2])

      process.nextTick(->
        expect(externalVariable.value()).to.equal(2)
        data.value([10])

        process.nextTick(->
          expect(externalVariable.value()).to.equal(10)
          done()
        )
      )
    )

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
    process.nextTick(->
      firstDivs = {}
      divs = d3.select('body').selectAll('div')
      divs.each((d, i) ->
        expect(d).to.equal(i)
        firstDivs[i] = this
      )
      expect(divs.size()).to.equal(2)
      data.value([0, 1, 2])

      process.nextTick(->
        divs = d3.select('body').selectAll('div')
        divs.each((d, i) ->
          expect(d).to.equal(i)
          if i < 2
            expect(this).to.equal(firstDivs[i])
        )
        expect(divs.size()).to.equal(3)
        done()
      )
    )

  it 'removes the element correctly without destroying original element', (done) ->
    data = dvl([0, 1, 2])
    collection = dvl.collection(data, (number) ->
      dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum: number
        text: String
      }
    )
    process.nextTick(->
      firstDivs = {}
      divs = d3.select('body').selectAll('div')
      divs.each((d, i) ->
        expect(d).to.equal(i)
        firstDivs[i] = this
      )
      expect(divs.size()).to.equal(3)
      data.value([0, 1])

      process.nextTick(->
        divs = d3.select('body').selectAll('div')
        divs.each((d, i) ->
          expect(d).to.equal(i)
          expect(this).to.equal(firstDivs[i])
        )
        expect(divs.size()).to.equal(2)
        done()
      )
    )


  it 'order the element correctly', (done) ->
    data = dvl([0, 1])
    collection = dvl.collection(data, (number) ->
      dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum: number
        text: String
      }
    )
    process.nextTick(->
      firstDivs = {}
      divs = d3.select('body').selectAll('div')
      expect(divs.size()).to.equal(2)
      divs.each((d, i) ->
        expect(d).to.equal(i)
        firstDivs[i] = this
      )
      data.value([1, 0])

      process.nextTick(->
        divs = d3.select('body').selectAll('div')
        expect(divs.size()).to.equal(2)
        divs.each((d, i) ->
          expect(d).to.equal(1 - i)
          expect(this).to.equal(firstDivs[i])
        )
        done()
      )
    )



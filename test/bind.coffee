{ expect } = require 'chai'
d3 = require 'd3'

dvl = require '../src'

nextTick = (fn) ->
  setTimeout(fn, 0)

verifyCleanState = -> throw new Error('Body is not empty') unless d3.select('body').selectAll('div').size() is 0
cleanUp = -> d3.select('body').selectAll('div').remove()

describe 'dvl.bind', ->
  describe 'when data is an array', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'enters 1 elements for the array of length 1', (done) ->
      data = dvl([0])
      boundSelections = dvl.bind {
        parent: d3.select('body')
        self: 'div'
        data
        text: String
      }

      nextTick(->
        selections = boundSelections.value()
        expect(selections).to.exist
        expect(selections.size()).to.equal(1)
        selections.each((d, i) ->
          expect(d).to.equal(i)
          expect(String(d)).to.equal(this.textContent)
        )
        done()
      )

    it 'enters 5 elements for the array of length 5', (done) ->
      data = dvl([0, 1, 2, 3, 4])
      boundSelections = dvl.bind {
        parent: d3.select('body')
        self: 'div'
        data
        text: String
      }

      nextTick(->
        selections = boundSelections.value()
        expect(selections).to.exist
        expect(selections.size()).to.equal(5)
        selections.each((d, i) ->
          expect(d).to.equal(i)
          expect(String(d)).to.equal(this.textContent)
        )
        done()
      )

  describe 'when data is not array', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'does not enter the element', (done) ->
      data = dvl(0)
      boundSelections = dvl.bind {
        parent: d3.select('body')
        self: 'div'
        data
        text: String
      }

      nextTick(->
        selections = boundSelections.value()
        expect(selections).to.exist
        expect(selections.size()).to.equal(0)
        done()
      )


  describe 'when data is null', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'does not enter the element', (done) ->
      data = dvl(null)
      boundSelections = dvl.bind {
        parent: d3.select('body')
        self: 'div'
        data
        text: String
      }

      nextTick(->
        selections = boundSelections.value()
        expect(selections).to.exist
        expect(selections.size()).to.equal(0)
        done()
      )

  describe 'when bind is gone', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'exits 1 element', (done) ->
      data = dvl([0])
      boundSelections = null
      block = dvl.block ->
        boundSelections = dvl.bind {
          parent: d3.select('body')
          self: 'div'
          data
          text: String
        }

      nextTick(->
        selections = boundSelections.value()
        expect(selections).to.exist
        expect(selections.size()).to.equal(1)
        selections.each((d, i) ->
          expect(d).to.equal(i)
          expect(String(d)).to.equal(this.textContent)
        )

        block.discard()
        nextTick(->
          selections = boundSelections.value()
          expect(selections).to.not.exist
          expect(d3.select('body').selectAll('div').size()).to.equal(0)
          done()
        )
      )

    it 'exits multiple elements', (done) ->
      data = dvl([0, 1, 2, 3, 4])
      boundSelections = null
      block = dvl.block ->
        boundSelections = dvl.bind {
          parent: d3.select('body')
          self: 'div'
          data
          text: String
        }

      nextTick(->
        selections = boundSelections.value()
        expect(selections).to.exist
        expect(selections.size()).to.equal(5)
        selections.each((d, i) ->
          expect(d).to.equal(i)
          expect(String(d)).to.equal(this.textContent)
        )

        block.discard()
        nextTick(->
          selections = boundSelections.value()
          expect(selections).to.not.exist
          expect(d3.select('body').selectAll('div').size()).to.equal(0)
          done()
        )
      )


describe 'dvl.bindSingle', ->
  describe 'when datum is an array', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'enters 1 element for the array of length 1', (done) ->
      datum = dvl([0])
      boundSelection = dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum
        text: String
      }

      nextTick(->
        selection = boundSelection.value()
        expect(selection).to.exist
        expect(selection.size()).to.equal(1)
        expect(selection.data()).to.deep.equal([[0]])
        expect(selection.text()).to.equal('0')
        done()
      )

    it 'enters 1 element for the array of length 5', (done) ->
      datum = dvl([0, 1, 2, 3, 4])
      boundSelection = dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum
        text: String
      }

      nextTick(->
        selection = boundSelection.value()
        expect(selection).to.exist
        expect(selection.size()).to.equal(1)
        expect(selection.data()).to.deep.equal([[0, 1, 2, 3, 4]])
        expect(selection.text()).to.equal('0,1,2,3,4')
        done()
      )


  describe 'when datum is not array', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'enter 1 element', (done) ->
      datum = dvl(0)
      boundSelection = dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum
        text: String
      }

      nextTick(->
        selection = boundSelection.value()
        expect(selection).to.exist
        expect(selection.size()).to.equal(1)
        expect(selection.data()).to.deep.equal([0])
        expect(selection.text()).to.equal('0')
        done()
      )


  describe 'when datum is null', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'enters the element', (done) ->
      datum = dvl(null)
      boundSelection = dvl.bindSingle {
        parent: d3.select('body')
        self: 'div'
        datum
        text: String
      }

      nextTick(->
        selection = boundSelection.value()
        expect(selection).to.exist
        expect(selection.size()).to.equal(1)
        expect(selection.text()).to.equal('undefined')
        done()
      )


  describe 'when bind is gone', ->
    beforeEach verifyCleanState
    afterEach cleanUp

    it 'exits the element', (done) ->
      datum = dvl(0)
      boundSelection = null
      block = dvl.block ->
        boundSelection = dvl.bindSingle {
          parent: d3.select('body')
          self: 'div'
          datum
          text: String
        }

      nextTick(->
        selection = boundSelection.value()
        expect(selection).to.exist
        expect(selection.size()).to.equal(1)
        expect(selection.data()).to.deep.equal([0])
        expect(selection.text()).to.equal('0')

        block.discard()
        nextTick(->
          selections = boundSelection.value()
          expect(selections).to.not.exist
          expect(d3.select('body').selectAll('div').size()).to.equal(0)
          done()
        )
      )

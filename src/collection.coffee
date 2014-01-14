dvl = require './core'

class DVLCollection
  constructor: ({data, compare, fn}) ->
    compare ?= false

    varBlocks = [] # { v: DVL(), block: DVLBlock() }

    adjust = ->
      _data = data.value()

      dvl.group(->
        while _data.length > varBlocks.length
          v = null
          block = dvl.block ->
            v = dvl().compare(compare)
            fn(v)

          varBlocks.push({
            v
            block
          })

        while varBlocks.length > _data.length
          varBlock = varBlocks.pop()
          varBlock.v.discard()
          varBlock.block.discard()

        for d, i in _data
          varBlocks[i].v.value(d)
      )()
      return


    dvl.register {
      listen: data
      fn: ->
        return unless Array.isArray(data.value())

        process.nextTick(adjust)
    }

    data.value(data.value())

  toString: ->
    return '[DVLCollection]'

  @factory: () ->
    switch arguments.length
      when 1
        {data, serialize, fn} = arguments[0]
      when 2
        [data, fn] = arguments
      else
        throw ("incorect number of arguments")

    throw new Error('data should be dvl variable') unless dvl.knows(data)
    throw new Error('function should be provided') unless typeof fn is 'function'

    serialize ?= (item) -> String(item).toString()

    return new DVLCollection {
      data
      fn
      serialize
    }


module.exports = DVLCollection.factory

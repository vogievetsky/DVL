dvl = require './core'

class DVLCollection
  constructor: ({data, serialize, fn}) ->
    @_data = data
    @_serialize = serialize
    @_fn = fn

    @_blocks = {} # key: serialized. # value: blocks
    @_dvlSingles = {} # key: serialized. # value: blocks
    @_positions = {} # value: position. # key: serialized

    that = this

    dvl.register {
      listen: data
      fn: ->
        _data = data.value()
        return unless Array.isArray(_data)

        setTimeout(->
          that._buildBlocks(_data)
          that._destroyBlocks(_data)
        , 0)
    }

    data.value(data.value())

  toString: ->
    return '[DVLCollection]'

  _destroyBlocks: (_data) ->
    _serializedData = _data.map(@_serialize)
    for own k, _block of @_blocks
      if k not in _serializedData
        console.log k, 'here'
        delete @_blocks[k]
        _block.discard()
    return

  _buildBlocks: (_data) ->
    that = this
    _data.forEach((_datum, i) ->
      _serializedDatum = that._serialize(_datum)
      # block exists
      if that._blocks[_serializedDatum]
        # at the right position
        return if _serializedDatum is that._positions[i] # return
        # at the wrong position
        _badSerializedDatum = that._positions[i]
        that._dvlSingles[_badSerializedDatum].value(_datum) # update the appropriate dvl variable using index
        that._dvlSingles[_serializedDatum] = that._dvlSingles[_badSerializedDatum]
        delete that._dvlSingles[_badSerializedDatum]
        return

      # block doesn't exist
      that._blocks[_serializedDatum] = dvl.block -> # create the new block.
        that._dvlSingles[_serializedDatum] ?= dvl(_datum)
        that._positions[i] = _serializedDatum
        that._fn(that._dvlSingles[_serializedDatum])
    )

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


# dimmensions = dvl([])

# dvl.collection({
#   data: dimmensions
#   compare: (a, b) -> a is b
#   fn: (dimmension) ->
#     makeSideTable({
#       parent: sideTableCont
#       dimmension
#       where: gv.where
#     })
#     return
# })


# a: [Dim(page), Dim(lang)]
# blocks: [
#   { v: Dim(page), b:Block(Table(page)) }
# ]
# Table(page), Table(lang)

# b: [Dim(page), Dim(robot), Dim(lang)]
# Table(page), Table(lang), Table(robot)

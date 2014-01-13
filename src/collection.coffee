dvl = require './core'

class DVLCollection
  constructor: ({data, serialize, fn}) ->
    @_data = data
    @_serialize = serialize
    @_fn = fn

    @_dvlBlocks = {} # key: serialized. # value: blocks
    @_dvlVariables = {} # key: serialized. # value: blocks
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
    for own k, _block of @_dvlBlocks
      if k not in _serializedData
        delete @_dvlBlocks[k]
        _block.discard()
    return

  _buildBlocks: (_data) ->
    that = this
    transitionMap = {}
    badSerials = []
    _data.forEach((_datum, i) ->
      _serializedDatum = that._serialize(_datum)
      if not that._dvlBlocks[_serializedDatum]?
        # block doesn't exist
        that._dvlBlocks[_serializedDatum] = dvl.block -> # create the new block.
          that._dvlVariables[_serializedDatum] = dvl(_datum)
          that._positions[i] = _serializedDatum
          that._fn(that._dvlVariables[_serializedDatum])

      # at the right position
      return if _serializedDatum is that._positions[i]
      # else
      badSerials.push _badSerializedDatum = that._positions[i]
      transitionMap[_serializedDatum] = {
        badSerial: _badSerializedDatum
        datum: _datum
        index: i
      }
    )

    tempDvlVariables = {}
    tempDvlBlocks = {}

    for k, v of transitionMap
      tempDvlVariables[k] = @_dvlVariables[v.badSerial]
      tempDvlBlocks[k] = @_dvlBlocks[v.badSerial]

    for k, v of transitionMap
      @_dvlVariables[k] = tempDvlVariables[k]
      @_dvlBlocks[k] = tempDvlBlocks[k]
      @_dvlVariables[k].value(v.datum)
      @_positions[v.index] = k
      badSerials.splice(badSerials.indexOf(k), 1)

    for badSerial in badSerials
      delete @_dvlVariables[badSerial]
      delete @_dvlBlocks[badSerial]

    return

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

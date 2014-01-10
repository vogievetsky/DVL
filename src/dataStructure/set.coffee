class Set
  constructor: ->
    @map = {}
    @len = 0

  valueOf: -> @map

  length: -> @len

  add: (obj) ->
    if not @map.hasOwnProperty(obj.id)
      @map[obj.id] = obj
      @len++
    return this

  remove: (obj) ->
    if @map.hasOwnProperty(obj.id)
      delete @map[obj.id]
      @len--
    return this


module.exports = Set

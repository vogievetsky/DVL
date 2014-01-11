dvl = require './core'

# Data # ------------------------------------------------

data = {}

data.min = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: (_data, _acc) -> _data.reduce((_prev, _curr) -> if _acc(_prev) > _acc(_curr) then _curr else _prev)
  }

data.max = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: (_data, _acc) -> _data.reduce((_prev, _curr) -> if _acc(_prev) < _acc(_curr) then _curr else _prev)
  }

module.exports = data

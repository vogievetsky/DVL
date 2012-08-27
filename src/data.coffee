# Data # ------------------------------------------------

dvl.data = {}

dvl.data.min = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: (data, acc) -> d3.min(data.valueOf(), acc)
  }

dvl.data.max = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: (data, acc) -> d3.max(data.valueOf(), acc)
  }
# Data # ------------------------------------------------

dvl.data = {}

dvl.data.min = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: d3.min
  }

dvl.data.max = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: d3.max
  }
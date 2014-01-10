d3 = require 'd3'

dvl = require './core'

# misc # --------------------------------------------------
miscModule = {}
miscModule.mouse = (element, out) ->
  element = dvl.wrap(element)
  width   = dvl.wrap(width)
  height  = dvl.wrap(height)
  out     = dvl.wrapVar(out, 'mouse')

  recorder = ->
    _element = element.value()
    mouse = if _element and d3.event then d3.mouse(_element.node()) else null
    out.value(mouse)
    return

  element.value()
    .on('mousemove', recorder)
    .on('mouseout', recorder)

  dvl.register {
    name: 'mouse_recorder'
    listen: element
    change: out
    fn: recorder
  }

  return out


miscModule.delay = (data, time = 1) ->
  data = dvl.wrap(data)
  time = dvl.wrap(time)
  timer = null
  out = dvl()

  timeoutFn = ->
    out.value(data.value())
    timer = null
    return

  dvl.register {
    listen: [data, time]
    change: [out]
    name: 'timeout'
    fn: ->
      clearTimeout(timer) if timer
      timer = null
      if time.value()?
        t = Math.max(0, time.value())
        timer = setTimeout(timeoutFn, t)
      return
  }
  return out


module.exports = miscModule

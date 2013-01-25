dvl.snap = ({data, acc, value, trim, name}) ->
  throw 'No data given' unless data
  acc = dvl.wrap(acc or dvl.identity)
  value = dvl.wrap(value)
  trim = dvl.wrap(trim or false)
  name or= 'snaped_data'

  out = dvl(null).name(name)

  updateSnap = ->
    ds = data.value()
    a = acc.value()
    v = value.value()

    if ds and a and v
      ds = ds.valueOf()
      if trim.value() and ds.length isnt 0 and (v < a(ds[0]) or a(ds[ds.length-1]) < v)
        minIdx = -1
      else
        minIdx = -1
        minDist = Infinity
        if ds
          for d,i in ds
            dist = Math.abs(a(d) - v)
            if dist < minDist
              minDist = dist
              minIdx = i

      minDatum = if minIdx < 0 then null else ds[minIdx]
      out.set(minDatum) unless out.value() is minDatum
    else
      out.set(null)

    dvl.notify(out)

  dvl.register({fn:updateSnap, listen:[data, acc, value, trim], change:[out], name:name+'_maker'})
  return out

# misc # --------------------------------------------------

dvl.misc = {}
dvl.misc.mouse = (element, out) ->
  element = dvl.wrap(element)
  width   = dvl.wrap(width)
  height  = dvl.wrap(height)
  out     = dvl.wrapVar(out, 'mouse')

  recorder = ->
    _element = element.value()
    mouse = if _element and d3.event then d3.svg.mouse(_element.node()) else null
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


dvl.misc.delay = (data, time = 1) ->
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

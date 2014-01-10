dvl = require './core'

module.exports = ({data, acc, value, trim, name}) ->
  throw new Error('No data given') unless data
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

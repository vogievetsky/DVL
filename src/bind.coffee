dvl = require './core'

# dvl.bind # --------------------------------------------------

id_class_spliter = /(?=[#.:])/
def_data_fn = dvl.const((d) -> [d])
class_concat = dvl.op((s, d) -> s + ' ' + (d or ''))

bind = ({parent, self, data, join, attr, style, property, text, html, on:argsOn, transition, transitionExit}) ->
  throw "'parent' not defined" unless parent
  throw "'self' not defined" unless typeof self is 'string'
  parts = self.split(id_class_spliter)
  nodeType = parts.shift()
  staticId = null
  staticClass = []
  for part in parts
    switch part[0]
      when '#'
        staticId = part.substring(1)
      when '.'
        staticClass.push part.substring(1)
      else
        throw "not currently supported in 'self' (#{part})"

  staticClass = staticClass.join(' ')

  parent = dvl.wrap(parent)
  data = dvl.wrap(data or def_data_fn)
  join = dvl.wrap(join)
  text = if text then dvl.wrap(text) else null
  html = if html then dvl.wrap(html) else null
  transition = dvl.wrap(transition)
  transitionExit = dvl.wrap(transitionExit)

  listen = [parent, data, join, text, html, transition, transitionExit]

  attrList = {}
  for k, v of attr
    v = dvl.wrap(v)
    if k is 'class' and staticClass
      v = class_concat(staticClass, v)

    listen.push(v)
    attrList[k] = v

  if staticClass and not attrList['class']
    attrList['class'] = dvl.const(staticClass)

  styleList = {}
  for k, v of style
    v = dvl.wrap(v)
    listen.push(v)
    styleList[k] = v

  propertyList = {}
  for k, v of property
    v = dvl.wrap(v)
    listen.push(v)
    propertyList[k] = v

  onList = {}
  for k, v of argsOn
    v = dvl.wrap(v)
    listen.push(v)
    onList[k] = v

  out = dvl().name('selection')

  bindWorker = dvl.register {
    listen
    change: [out]
    fn: ->
      _parent = parent.value()
      return unless _parent

      force = parent.hasChanged() or data.hasChanged() or join.hasChanged()
      _data = data.value()
      _join = join.value()

      if _data
        _data = _data.valueOf()
        _transition = transition.value()
        _transitionExit = transitionExit.value()

        # prep
        enter     = []
        preTrans  = []
        postTrans = []

        add1 = (fn, v) ->
          if v.hasChanged() or force
            preTrans.push  { fn, a1: v.getPrev() }
            postTrans.push { fn, a1: v.value() }
          else
            enter.push  { fn, a1: v.value() }
          return

        add2 = (fn, k, v) ->
          if v.hasChanged() or force
            enter.push     { fn, a1: k, a2: v.getPrev() }
            preTrans.push  { fn, a1: k, a2: v.getPrev() }
            postTrans.push { fn, a1: k, a2: v.value() }
          else
            enter.push     { fn, a1: k, a2: v.value() }
          return

        addO = (fn, k, v) ->
          if v.hasChanged() or force
            preTrans.push { fn, a1: k, a2: v.value() }
          else
            enter.push  { fn, a1: k, a2: v.value() }
          return

        add1('text', text)  if text
        add1('html', html)  if html
        add2('attr', k, v)  for k, v of attrList
        add2('style', k, v) for k, v of styleList
        add2('property', k, v) for k, v of propertyList
        addO('on', k, v)    for k, v of onList

        # d3 stuff
        s = _parent.selectAll(self).data(_data, _join)
        e = s.enter().append(nodeType)

        e[a.fn](a.a1, a.a2) for a in enter

        s[a.fn](a.a1, a.a2) for a in preTrans

        if _transition and _transition.duration?
          t = s.transition()
          t.duration(_transition.duration or 1000)
          t.delay(_transition.delay) if _transition.delay
          t.ease(_transition.ease)   if _transition.ease
        else
          t = s

        t[a.fn](a.a1, a.a2) for a in postTrans

        ex = s.exit().remove()
        out.value(s) if not e.empty() or not ex.empty() or force
      else
        s = _parent.selectAll(self).remove()
        out.value(s)

      return
  }

  bindWorker.on('discard', ->
    out.value().remove()
    out.value(null)
  )

  return out


bindSingle = ({parent, self, data, datum, attr, style, property, text, html, on:argsOn, transition}) ->
  throw new Error("bindSingle does not accept a parameter 'data'. Did you mean 'datum'?") if data

  if typeof self is 'string'
    throw "'parent' not defined for string self" unless parent
    parts = self.split(id_class_spliter)
    nodeType = parts.shift()
    staticId = null
    staticClass = []
    for part in parts
      switch part[0]
        when '#'
          staticId = part.substring(1)
        when '.'
          staticClass.push part.substring(1)
        else
          throw "not currently supported in 'self' (#{part})"

    staticClass = staticClass.join(' ')

    self = dvl.valueOf(parent).append(nodeType)
    self.attr('id', staticId) is staticId
    self.attr('class', staticClass) is staticClass
  else
    staticClass = self.attr('class')

  self = dvl.wrapVar(self)

  datum = dvl.wrap(datum)
  text = if text then dvl.wrap(text) else null
  html = if html then dvl.wrap(html) else null
  transition = dvl.wrap(transition)

  listen = [datum, text, html, transition]

  attrList = {}
  for k, v of attr
    v = dvl.wrap(v)
    if k is 'class' and staticClass
      v = class_concat(staticClass, v)

    listen.push(v)
    attrList[k] = v

  styleList = {}
  for k, v of style
    v = dvl.wrap(v)
    listen.push(v)
    styleList[k] = v

  propertyList = {}
  for k, v of property
    v = dvl.wrap(v)
    listen.push(v)
    propertyList[k] = v

  onList = {}
  for k, v of argsOn
    v = dvl.wrap(v)
    listen.push(v)
    onList[k] = v

  bindWorker = dvl.register {
    listen
    change: [self]
    fn: ->
      sel = self.value()
      _datum = datum.value()
      force = datum.hasChanged()
      sel.datum(_datum) if force

      for k, v of attrList
        sel.attr(k, v.value()) if v.hasChanged() or force

      for k, v of styleList
        sel.style(k, v.value()) if v.hasChanged() or force

      for k, v of propertyList
        sel.property(k, v.value()) if v.hasChanged() or force

      for k, v of onList
        sel.on(k, v.value()) if v.hasChanged() or force

      sel.text(text.value()) if text and (text.hasChanged() or force)
      sel.html(html.value()) if html and (html.hasChanged() or force)

      self.notify() if force
      return
  }


  bindWorker.on('discard', ->
    self.value().remove()
    self.value(null)
  )

  return self


module.exports = {
  bind
  bindSingle
}

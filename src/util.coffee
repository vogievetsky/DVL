utilModule = {
  typeOf: do ->
    toString = Object.prototype.toString
    return (v) ->
      type = toString.call(v)
      return type.substring(8, type.length - 1).toLowerCase()

  strObj: (obj) ->
    type = utilModule.typeOf(obj)
    if type in ['object', 'array']
      str = []
      keys = []
      for k of obj
        continue unless obj.hasOwnProperty(k)
        keys.push k
      keys.sort()
      str.push k, utilModule.strObj(obj[k]) for k in keys
      return str.join('|')

    if type is 'function'
      return '&'

    return String(obj)

  uniq: (array) ->
    seen = {}
    uniq = []
    for a in array
      uniq.push a unless seen[a]
      seen[a] = 1

    return uniq

  isEqual: (a, b, cmp) ->
    # Check object identity.
    return true if a is b
    # Different types?
    atype = utilModule.typeOf(a)
    btype = utilModule.typeOf(b)
    return false if atype isnt btype
    # One is falsy and the other truthy.
    return false if (not a and b) or (a and not b)
    # Check dates' integer values.
    return a.getTime() is b.getTime() if atype is 'date'
    # Both are NaN?
    return false if a isnt a and b isnt b
    # and Compare regular expressions.
    return a.source is b.source and a.global is b.global and a.ignoreCase is b.ignoreCase and a.multiline is b.multiline if atype is 'regexp'
    # If a is not an object by this point, we can't handle it.
    return false unless atype is 'object' or atype is 'array'
    # Check if already compared
    if cmp
      for c in cmp
        return true if (c.a is a and c.b is b) or (c.a is b and c.b is a)
    # Check for different array lengths before comparing contents.
    return false if a.length? and a.length isnt b.length
    # Nothing else worked, deep compare the contents.
    aKeys = []
    aKeys.push k for k of a
    bKeys = []
    bKeys.push k for k of b
    # Different object sizes?
    return false if aKeys.length isnt bKeys.length
    # Recursive comparison of contents.
    cmp = if cmp then cmp.slice() else []
    cmp.push {a,b}
    for k of a
      return false unless b[k]? and utilModule.isEqual(a[k], b[k], cmp)

    return true

  clone: (obj) ->
    t = utilModule.typeOf(obj)
    switch t
      when 'array'
        return obj.slice()
      when 'object'
        ret = {}
        ret[k] = v for k,v of obj
        return ret
      when 'date'
        return new Date(obj.getTime())
      else
        return obj

  escapeHTML: (str) ->
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/>/g, '&gt;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')
}


module.exports = utilModule

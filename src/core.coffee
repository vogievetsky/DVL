# Vadim Ogievetsky

# DVL is a framework for building highly interactive user interfaces and data visualizations dynamically with JavaScript.
# DVL is based the concept that the data in a program should be the programmer’s main focus.

dvl = (value) -> new DVLVar(value)
dvl.version = '1.1.0'
this.dvl = dvl
if typeof module isnt 'undefined' and module.exports
  module.exports = dvl
  dvl.dvl = dvl

dvl.typeOf = do ->
  toString = Object.prototype.toString
  return (v) ->
    type = toString.call(v)
    return type.substring(8, type.length - 1).toLowerCase()

dvl.util = {
  strObj: (obj) ->
    type = dvl.typeOf(obj)
    if type in ['object', 'array']
      str = []
      keys = []
      keys.push k for k of obj
      keys.sort()
      str.push k, dvl.util.strObj(obj[k]) for k in keys
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

  crossDomainPost: (url, params) ->
    frame = d3.select('body').append('iframe').style('display', 'none')

    clean = (d) -> d.replace(/'/g, "\\'")
    inputs = []
    inputs.push "<input name='#{k}' value='#{clean(v)}'/>" for k,v of params

    post_process = frame.node().contentWindow.document
    post_process.open()
    post_process.write "<form method='POST' action='#{url}'>#{inputs.join('')}</form>"
    post_process.write "<script>window.onload=function(){document.forms[0].submit();}</script>"
    post_process.close()
    setTimeout(frame.remove, 800)
    return;

  isEqual: (a, b, cmp) ->
    # Check object identity.
    return true if a is b
    # Different types?
    atype = dvl.typeOf(a)
    btype = dvl.typeOf(b)
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
      return false unless b[k]? and dvl.util.isEqual(a[k], b[k], cmp)

    return true

  clone: (obj) ->
    t = dvl.typeOf(obj)
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


nextObjId = 1

variables = []
workers = []

curBlock = null
default_compare = (a, b) -> a is b

class DVLConst
  constructor: (val) ->
    @v = val ? null
    @changed = false
    return this

  toString: ->
    tag = if @n then @n + ':' else ''
    return "[#{@tag}#{@v}]"

  value: (val) ->
    return if arguments.length then this else @v

  set: -> this
  lazyValue: -> this
  update: -> this
  get: -> @v
  getPrev: -> @v
  hasChanged: -> @changed
  resetChanged: -> null
  notify: -> null
  discard: -> null
  name: ->
    if arguments.length is 0
      return @n ? '<anon_const>'
    else
      @n = arguments[0]
      return this
  compare: -> if arguments.length then this else default_compare
  apply: (fn) -> dvl.apply(this, fn)
  applyValid: (fn) -> dvl.applyValid(this, fn)
  applyAlways: (fn) -> dvl.applyAlways(this, fn)
  pluck: (prop) -> dvl.apply(this, (d) -> d[prop])
  pluckEx: (prop) -> dvl.apply(this, (d) -> d[prop]())

  setGen: -> this
  gen: ->
    that = this
    if dvl.typeOf(@v) is 'array'
      (i) -> that.value[i]
    else
      () -> that.value
  genPrev: (i) -> @gen(i)
  len: ->
    if dvl.typeOf(@v) is 'array'
      @v.length
    else
      Infinity

class DVLVar
  constructor: (val) ->
    @v = val ? null
    @id = nextObjId++
    @prev = null
    @changed = false
    @vgen = undefined
    @vgenPrev = undefined
    @vlen = -1
    @lazy = null
    @listeners = []
    @changers = []
    @compareFn = default_compare
    variables.push(this)
    curBlock.addMemeber(this) if curBlock
    return this

  resolveLazy: ->
    if @lazy
      @prev = @v
      @v = @lazy()
      @lazy = null
    return

  toString: ->
    tag = if @n then @n + ':' else ''
    return "[#{@tag}#{@val}]"

  hasChanged: -> @changed

  resetChanged: ->
    @changed = false
    return this

  value: (val) ->
    if arguments.length
      val = val ? null
      if not (@compareFn and @compareFn(val, @v))
        this.set(val)
        dvl.notify(this)
      return this
    else
      @resolveLazy()
      return @v

  set: (val) ->
    val = val ? null
    @prev = @v unless @changed
    @v = val
    @vgen = undefined
    @changed = true
    @lazy = null
    return this
  lazyValue: (fn) ->
    @lazy = fn
    @changed = true
    dvl.notify(this)
    return this
  update: (val) ->
    if not dvl.util.isEqual(val, @v)
      this.set(val)
      dvl.notify(this)
    return this
  get: ->
    @resolveLazy()
    return @v
  getPrev: ->
    @resolveLazy()
    if @prev and @changed then @prev else @v
  notify: ->
    dvl.notify(this)
  discard: ->
    if @listeners.length > 0
      throw "Cannot remove variable #{@id} because it has listeners."
    if @changers.length > 0
      throw "Cannot remove variable #{@id} because it has changers."
    variables.splice(variables.indexOf(this), 1)
    return null
  name: ->
    if arguments.length is 0
      return @n ? '<anon>'
    else
      @n = arguments[0]
      return this
  compare: ->
    if arguments.length
      @compareFn = arguments[0]
      return this
    else
      return @compareFn
  apply: (fn) -> dvl.apply(this, fn)
  applyValid: (fn) -> dvl.applyValid(this, fn)
  applyAlways: (fn) -> dvl.applyAlways(this, fn)
  pluck: (prop) -> dvl.apply(this, (d) -> d[prop])
  pluckEx: (prop) -> dvl.apply(this, (d) -> d[prop]())

  setGen: (g, l) ->
    if g is null
      l = 0
    else
      l = Infinity if l is undefined
    @vgenPrev = @vgen unless @changed
    @vgen = g
    @vlen = l
    @changed = true
    return this
  gen: ->
    if @vgen != undefined
      return @vgen
    else
      that = this
      if dvl.typeOf(@v) is 'array'
        return ((i) -> that.value[i])
      else
        return (-> that.value)
  genPrev: ->
    if @vgenPrev and @changed then @vgenPrev else @gen()
  len: ->
    if @vlen >= 0
      return @vlen
    else
      if @v?
        return if dvl.typeOf(@v) is 'array' then @v.length else Infinity
      else
        return 0


dvl.def   = (value) -> new DVLVar(value)
dvl.const = (value) -> new DVLConst(value)

dvl.knows = (v) -> v instanceof DVLVar or v instanceof DVLConst


class DVLWorker
  constructor: (@name, @ctx, @fn, @listen, @change) ->
    @id = nextObjId++
    @updates = new Set()
    @level = workers.length # place at the end
    workers.push(this)

    # Append listen and change to variables and dependency graph
    hasPrev = false
    for v in @listen
      v.listeners.push(this)
      for prevWorker in v.changers
        prevWorker.updates.add(this)
        hasPrev = true

    for v in @change
      v.changers.push(this)
      for nextWorker in v.listeners
        @updates.add(nextWorker)

    # the optimization is that if we are adding a sink worker then it's level is just the last level
    if @updates.length()
      min = Infinity
      for nwid, nextWorker of @updates.valueOf()
        lvl = nextWorker.level
        min = lvl if lvl < min
      sortGraph(min)

    curBlock.addMemeber(this) if curBlock

  addChange: ->
    uv = uniqById(arguments)

    if uv.length
      updatesChanged = false
      for v in uv
        @change.push(v)
        v.changers.push(this)
        for nextWorker in v.listeners
          @updates.add(nextWorker)
          updatesChanged = true

      sortGraph() if updatesChanged

    return this

  addListen: ->
    uv = uniqById(arguments)

    if uv.length
      updatesChanged = false
      for v in uv
        @listen.push(v)
        v.listeners.push(this)
        for prevWorker in v.changers
          prevWorker.updates.add(this)
          updatesChanged = true
          hasPrev = false

      sortGraph() if updatesChanged

    uv = uniqById(arguments, true)
    start_notify_collect(this)
    changedSave = []
    for v in uv
      changedSave.push(v.changed)
      v.changed = true
    @fn.apply(@ctx)
    for v,i in uv
      v.changed = changedSave[i]
    end_notify_collect()
    return this

  discard: ->
    # Find the register object
    workers.splice(workers.indexOf(this), 1)

    for v in @listen
      for prevWorker in v.changers
        prevWorker.updates.remove(this)

    for v in @change
      v.changers.splice(v.changers.indexOf(this), 1)

    for v in @listen
      v.listeners.splice(v.listeners.indexOf(this), 1)

    sortGraph()
    @change = @listen = @updates = null # cause an error if we hit these
    return

dvl.register = ({ctx, fn, listen, change, name, noRun}) ->
  throw new Error('cannot call register from within a notify') if curNotifyListener
  throw new TypeError('fn must be a function') if typeof(fn) != 'function'

  listen = [listen] unless dvl.typeOf(listen) is 'array'
  change = [change] unless dvl.typeOf(change) is 'array'

  listenConst = []
  if listen
    for v in listen
      listenConst.push v if v instanceof DVLConst

  listen = uniqById(listen)
  change = uniqById(change)

  # Make function/context holder object
  worker = new DVLWorker(name or 'fn', ctx, fn, listen, change)

  if not noRun
    # Save changes and run the function with everything as changed.
    changedSave = []
    for l,i in listen
      changedSave[i] = l.changed
      l.changed = true
    for l in listenConst
      l.changed = true

    start_notify_collect(worker)
    fn.call(ctx)
    end_notify_collect()

    for c,i in changedSave
      listen[i].changed = c
    for l in listenConst
      l.changed = false

  return worker




class DVLBlock
  constructor: (@name, @parent) ->
    @owns = {}
    @parent?.add(this)
    return

  addMemeber: (thing) ->
    @owns[thing.id] = thing
    return this

  removeMemeber: (thing) ->
    delete @owns[thing.id]
    return this

  discard: ->
    @parent?.removeMemeber(this)
    d.discard() for d in @owns
    return


dvl.blockFn = ->
  switch arguments.length
    when 1 then [fn] = arguments
    when 2 then [name, fn] = arguments
    else throw "bad number of arguments"

  return (args...) ->
    block = new DVLBlock(name, curBlock)
    ret = fn.apply(this, args)
    curBlock = block.parent
    return ret

dvl.block = ->
  switch arguments.length
    when 1 then [fn] = arguments
    when 2 then [name, fn] = arguments
    else throw "bad number of arguments"

  block = new DVLBlock(name, curBlock)
  fn.call(this)
  curBlock = block.parent
  return block


dvl.group = (fn) -> (fnArgs...) ->
  if dvl.notify is init_notify
    captured_notifies = []
    dvl.notify = (args...) ->
      Array::push.apply(captured_notifies, args)
      return
    fn.apply(this, fnArgs)
    dvl.notify = init_notify
    init_notify.apply(dvl, captured_notifies)
  else
    # this is already runing in a group or a register
    fn.apply(this, fnArgs)
  return

dvl.wrapConstIfNeeded =
dvl.wrap = (v, name) ->
  v = null if v is undefined
  if dvl.knows(v) then v else dvl.const(v).name(name)

dvl.wrapVarIfNeeded =
dvl.wrapVar = (v, name) ->
  v = null if v is undefined
  if dvl.knows(v) then v else dvl(v).name(name)

dvl.valueOf = (v) ->
  if dvl.knows(v)
    return v.value()
  else
    return v ? null

# filter out undefineds and nulls and constants also make unique
uniqById = (vs, allowConst) ->
  res = []
  if vs
    seen = {}
    for v in vs
      if v? and (allowConst or (v.listeners and v.changers)) and not seen[v.id]
        seen[v.id] = true
        res.push v
  return res

# Sorts the graph. Will sort nodes at levels [0, workers.length)
sortGraph = (from = 0) ->
  # L ← Empty list that will contain the sorted elements
  # S ← Set of all nodes with no incoming edges
  # while S is non-empty do
  #   remove a node n from S
  #   insert n into L
  #   for each node m with an edge e from n to m do
  #     remove edge e from the graph
  #     if m has no other incoming edges then
  #       insert m into S
  # if graph has edges then
  #   return error (graph has at least one cycle)
  # else
  #   return L (a topologically sorted order)

  idPriorityQueue = new PriorityQueue('id')

  # This can be precomputed
  getInboundCount = (worker, from) ->
    seen = {}
    count = 0
    for v in worker.listen
      for prevWorker in v.changers
        if from <= prevWorker.level and not seen[prevWorker.id]
          seen[prevWorker.id] = true
          ++count
    return count

  inboundCount = {}

  _sources = []

  # S ← Set of all nodes with no incoming edges
  # TODO: This can be optimized out to be it's own array
  i = from
  workersLength = workers.length
  while i < workersLength
    worker = workers[i++]
    isSource = true

    j = 0
    workerListen = worker.listen
    workerListenLength = workerListen.length
    while j < workerListenLength and isSource
      v = workerListen[j++]
      for prevWorker in v.changers
        if from <= prevWorker.level
          isSource = false
          break

    if isSource
      idPriorityQueue.push worker

  level = from
  while idPriorityQueue.length()
    worker = idPriorityQueue.shift()
    workers[worker.level = level++] = worker

    for nwid, nextWorker of worker.updates.valueOf()
      ic = inboundCount[nwid] or getInboundCount(nextWorker, from)
      ic--
      if ic is 0
        idPriorityQueue.push nextWorker
      else
        inboundCount[nwid] = ic

  if level isnt workers.length
    #console.log 'f', from, level, workers.length, dbg
    throw new Error('there is a cycle')

  return

dvl.clearAll = ->
  # disolve the graph to make the garbage collection job as easy as possible
  for worker in workers
    worker.listen = worker.change = worker.updates = null

  for v in variables
    v.listeners = v.changers = null

  # reset everything
  nextObjId = 1
  variables = []
  workers = []
  return


levelPriorityQueue = new PriorityQueue('level')

curNotifyListener = null
curCollectListener = null
changedInNotify = null
lastNotifyRun = null
toNotify = null


start_notify_collect = (listener) ->
  toNotify = []
  curCollectListener = listener
  dvl.notify = collect_notify
  return


end_notify_collect = ->
  curCollectListener = null
  dvl.notify = init_notify # ToDo: possible nested notify?

  dvl.notify.apply(null, toNotify)
  toNotify = null
  return


collect_notify = ->
  throw 'bad stuff happened during a collect block' unless curCollectListener

  for v in arguments
    continue unless v instanceof DVLVar
    throw "changed unregisterd object #{v.id}" if v not in curCollectListener.change
    toNotify.push v

  return


within_notify = ->
  throw 'bad stuff happened within a notify block' unless curNotifyListener

  for v in arguments
    continue unless v instanceof DVLVar
    throw "changed unregisterd object #{v.id}" if v not in curNotifyListener.change
    changedInNotify.push v
    lastNotifyRun.push v.id
    for l in v.listeners
      if not l.visited
        levelPriorityQueue.push l

  return


init_notify = ->
  throw 'bad stuff happened init' if curNotifyListener

  lastNotifyRun = []
  visitedListener = []
  changedInNotify = []

  for v in arguments
    continue unless v instanceof DVLVar
    changedInNotify.push v
    lastNotifyRun.push v.id
    levelPriorityQueue.push l for l in v.listeners

  dvl.notify = within_notify

  # Handle events in a BFS way
  while levelPriorityQueue.length() > 0
    curNotifyListener = levelPriorityQueue.shift()
    continue if curNotifyListener.visited
    curNotifyListener.visited = true
    visitedListener.push(curNotifyListener)
    lastNotifyRun.push(curNotifyListener.id)
    curNotifyListener.fn.apply(curNotifyListener.ctx)

  curNotifyListener = null
  dvl.notify = init_notify
  v.resetChanged() for v in changedInNotify
  l.visited = false for l in visitedListener # reset visited
  return


dvl.notify = init_notify

######################################################
##
##  Renders the variable graph into dot
##
dvl.graphToDot = (lastTrace, showId) ->
  execOrder = {}
  if lastTrace and lastNotifyRun
    for pos, id of lastNotifyRun
      execOrder[id] = pos

  nameMap = {}

  for worker in workers
    id = worker.id
    fnName = id.replace(/\n/g, '')
    #fnName = fnName.replace(/_\d+/, '') unless showId
    fnName = fnName + ' (' + worker.level + ')'
    # fnName += ' [[' + execOrder[worker.id] + ']]' if execOrder[worker.id]
    fnName = '"' + fnName + '"'
    nameMap[id] = fnName

  for v of variables
    id = v.id
    varName = id.replace(/\n/g, '')
    #varName = varName.replace(/_\d+/, '') unless showId
    # varName += ' [[' + execOrder[id] + ']]' if execOrder[id]
    varName = '"' + varName + '"'
    nameMap[id] = varName

  dot = []
  dot.push 'digraph G {'
  dot.push '  rankdir=LR;'

  levels = []
  for id, v of variables.valueOf()
    color = if execOrder[id] then 'red' else 'black'
    dot.push "  #{nameMap[id]} [color=#{color}];"

  for k, l of workers
    levels[l.level] or= []
    levels[l.level].push nameMap[l.id]
    color = if execOrder[l.id] then 'red' else 'black'

    dot.push "  #{nameMap[l.id]} [shape=box,color=#{color}];"
    for v in l.listen
      color = if execOrder[v.id] and execOrder[l.id] then 'red' else 'black'
      dot.push "  #{nameMap[v.id]} -> #{nameMap[l.id]} [color=#{color}];"
    for w in l.change
      color = if execOrder[l.id] and execOrder[w.id] then 'red' else 'black'
      dot.push "  #{nameMap[l.id]} -> #{nameMap[w.id]} [color=#{color}];"

  for level in levels
    dot.push('{ rank = same; ' + level.join('; ') + '; }')

  dot.push '}'
  return dot.join('\n')

dvl.postGraph = (file, showId) ->
  file or= 'dvl_graph'
  g = dvl.graphToDot(false, showId)
  dvl.util.crossDomainPost('http://localhost:8124/' + file, { graph: JSON.stringify(g) })
  return

dvl.postLatest = (file, showId) ->
  file or= 'dvl_graph_latest'
  g = dvl.graphToDot(true, showId)
  dvl.util.crossDomainPost('http://localhost:8124/' + file, { graph: JSON.stringify(g) })
  return

dvl.zero = dvl.const(0).name('zero')

dvl.null = dvl.const(null).name('null')

dvl.ident = (x) -> x
dvl.identity = dvl.const(dvl.ident).name('identity')


dvl.acc = (column) ->
  column = dvl.wrap(column)
  acc = dvl().name("acc")

  makeAcc = ->
    col = column.value();
    if col?
      col = String(col.valueOf())
      acc.value((d) -> d[col])
    else
      acc.value(null)

  dvl.register({fn:makeAcc, listen:[column], change:[acc], name:'make_acc'})
  return acc


# Workers # -----------------------------------------

######################################################
##
##  A DVL object debugger
##
##  Displays the object value with a message whenever the object changes.
##
dvl.debug = ->
  print = ->
    return unless console?.log
    console.log.apply(console, arguments)
    return arguments[0]

  if arguments.length is 1
    obj = dvl.wrap(arguments[0])
    note = obj.name() + ':'
  else
    obj = dvl.wrap(arguments[1])
    note = arguments[0]

  dvl.register {
    listen: [obj]
    fn: -> print note, obj.value()
  }
  return obj


######################################################
##
##  Sets up a pipline stage that automaticaly applies the given function.
##
dvl.apply = dvl.applyValid = ->
  switch arguments.length
    when 1
      {args, fn, invalid, allowNull, update} = arguments[0]
    when 2
      [args, fn] = arguments
    when 3
      [args, {invalid, allowNull, update}, fn] = arguments
    else
      throw "incorect number of arguments"

  fn = dvl.wrap(fn or dvl.identity)

  argsType = dvl.typeOf(args)
  if argsType is 'undefined'
    args = []
  else
    args = [args] unless argsType is 'array'
    args = args.map(dvl.wrap)

  invalid = dvl.wrap(invalid ? null)

  out = dvl(invalid.value()).name('apply_valid_out')

  dvl.register {
    name: 'apply_fn'
    listen: args.concat([fn, invalid])
    change: out
    fn: ->
      f = fn.value()
      return unless f?
      send = []
      nulls = false
      for a in args
        v = a.value()
        nulls = true unless v?
        send.push v

      if not nulls or allowNull
        r = f.apply(null, send)
        return if r is undefined
      else
        r = invalid.value()

      if update
        out.update(r)
      else
        out.set(r).notify()

      return
  }
  return out


dvl.applyAlways = ->
  switch arguments.length
    when 1
      {args, fn, update} = arguments[0]
    when 2
      [args, fn] = arguments
    when 3
      [args, {update}, fn] = arguments
    else
      throw "incorect number of arguments"

  fn = dvl.wrap(fn or dvl.identity)

  argsType = dvl.typeOf(args)
  if argsType is 'undefined'
    args = []
  else
    args = [args] unless argsType is 'array'
    args = args.map(dvl.wrap)

  out = dvl().name('apply_valid_out')

  dvl.register {
    name: 'apply_fn'
    listen: args.concat([fn])
    change: out
    fn: ->
      f = fn.value()
      return unless f?
      send = []
      for a in args
        send.push a.value()

      r = f.apply(null, send)
      return if r is undefined

      if update
        out.update(r)
      else
        out.set(r).notify()

      return
  }
  return out


dvl.random = (options) ->
  min = options.min or 0
  max = options.max or min + 10
  int = options.integer
  walk = options.walk

  random = dvl((max - min)/2, options.name or 'random')

  gen = ->
    if walk and walk > 0
      # do a random walk
      scale = walk * Math.abs(max - min)
      r = random.value() + scale*(2*Math.random()-1)
      r = min if r < min
      r = max if max < r
    else
      r = Math.random()*(max-min) + min

    r = Math.floor(r) if int
    random.set(r)
    dvl.notify(random)

  setInterval(gen, options.interval) if options.interval
  gen()
  return random


dvl.arrayTick = (data, options) ->
  throw 'dvl.arrayTick: no data' unless data
  data = dvl.wrap(data)

  point = options.start or 0
  move = options.move or 1

  out = dvl(null, 'array_tick_data')

  gen = ->
    d = data.value()
    len = d.length
    if len > 0
      v = d[point % len]
      point = (point + move) % len
      out.set(v)
      dvl.notify(out)

  setInterval(gen, options.interval) if options.interval
  gen()
  return out


dvl.recorder = (options) ->
  array = dvl.wrapVar(options.array or [], options.name or 'recorder_array').compare(false)

  data = options.data
  fn = dvl.wrap(options.fn or dvl.identity)
  throw 'it does not make sense not to have data' unless dvl.knows(data)

  max = dvl.wrap(options.max or +Infinity)
  i = 0

  record = ->
    d = fn.value()(data.value())
    m = max.value()
    if d?
      if options.value
         o = {}
         o[options.value] = d
         d = o
      d[options.index] = i if options.index
      d[options.timestamp] = new Date() if options.timestamp
      _array = array.value()
      _array.push(d)
      _array.shift() while m < _array.length
      array.value(_array)
      i += 1

  dvl.register({fn:record, listen:[data], change:[array], name:'recorder'})
  return array

do ->
  # dvl.urlHash {
  #   key: 'where'
  #   object: mmx.gv.where
  #   validator: () -> true
  #   history: false
  # }

  vars = []

  inputChange = ->
    obj = {}
    for v in vars
      obj[v.name] = v.object.value()

    window.location.hash = dvl.urlHash.toHashString(obj)
    return

  onHashChange = ->
    obj = dvl.urlHash.fromHashString(window.location.hash)
    for v in vars
      val = obj[v.name]
      if validate(val)
        v.object.value(val)
    return

  worker = null
  addHoock = (v) ->
    if worker
      worker.addListen(v)
    else
      worker = dvl.register {
        name:   'hash_man'
        listen: [v]
        fn:     inputChange
        force:  true
      }
      window.onhashchange = onHashChange

    return

  dvl.urlHash = ({key, object, validate}) ->
    vars.push { key, object, validate }
    addHoock(object)
    return

    updateHash = ->
      h = obj.value()
      window.location.hash = h unless window.location.hash is h

    dvl.register({fn:updateHash, listen:[obj], name:'hash_changer'})
    return

  dvl.urlHash.version = 3

  dvl.urlHash.upgradeVersion = ->
    throw "upgrade not defined"
    return

  dvl.urlHash.toHashString = (obj) ->
    return JSON.stringify(obj)

  dvl.urlHash.fromHashString = (str) ->
    return JSON.parse(str)

  return

# -------------------------------------------------------

dvl.chain = (f, h) ->
  f = dvl.wrap(f)
  h = dvl.wrap(h)

  out = dvl().name('chain')

  dvl.register {
    listen: [f, h]
    change: [out]
    fn: ->
      _f = f.value()
      _h = h.value()
      if _f and _h
        out.value((x) -> _h(_f(x)))
      else
        out.value(null)
      return
  }
  return out


do ->
  dvl_value = (v) -> v.value()
  dvl.op = dvl_op = (fn) ->
    liftedFn = lift(fn)
    return (args...) ->
      args = args.map(dvl.wrap)
      out = dvl()

      dvl.register {
        listen: args
        change: [out]
        fn: ->
          out.set(liftedFn.apply(null, args.map(dvl_value)))
          dvl.notify(out)
          return
      }

      return out

  op_to_lift = {
    'or': ->
      for arg in arguments
        return arg if arg
      return false

    'add': ->
      sum = 0
      for arg in arguments
        if arg?
          sum += arg
        else
          return null
      return sum

    'sub': ->
      sum = 0
      mult = 1
      for arg in arguments
        if arg?
          sum += arg * mult
          mult = -1
        else
          return null
      return sum

    'list': (args...) ->
      for arg in args
        return null unless arg?
      return args

    'concat': (args...) ->
      for arg in args
        return null unless arg?
      return args.join('')

    'iff': (cond, truthy, falsy) ->
      return if cond then truthy else falsy

    'iffEq': (lhs, rhs, truthy, falsy) ->
      return if lhs is rhs then truthy else falsy

    'iffLt': (lhs, rhs, truthy, falsy) ->
      return if lhs < rhs then truthy else falsy

    'makeTranslate': (x, y) ->
      return if x? and y? then "translate(#{x},#{y})" else null
  }

  dvl_op[k] = dvl_op(fn) for k, fn of op_to_lift
  return



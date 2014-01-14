# Vadim Ogievetsky

# DVL is a framework for building highly interactive user interfaces and data visualizations dynamically with JavaScript.
# DVL is based the concept that the data in a program should be the programmer’s main focus.

lift = require '../lib/lift'

PriorityQueue = require './dataStructure/priorityQueue'
Set = require './dataStructure/set'
utilModule = require './util'

nextObjId = 1

dvl = (value) -> new DVLVar(value)
dvl.version = '1.5.0'
dvl._variables = variables = []
dvl._workers = workers = []

# Available attributes / functions
#
# dvl._variables
# dvl._workers
# dvl.acc
# dvl.apply
# dvl.applyAlways
# dvl.block
# dvl.blockFn
# dvl.chain
# dvl.clearAll
# dvl.const
# dvl.debug
# dvl.def
# dvl.group
# dvl.ident
# dvl.identity
# dvl.knows
# dvl.namespace
# dvl.notify
# dvl.null
# dvl.op
# dvl.op[k]
# dvl.register
# dvl.sortGraph
# dvl.valueOf
# dvl.version
# dvl.wrap
# dvl.wrapConstIfNeeded
# dvl.wrapVar
# dvl.wrapVarIfNeeded
# dvl.zero

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
  verify: -> if arguments.length then this else null
  apply: (fn) -> dvl.apply(this, fn)
  applyValid: (fn) -> dvl.applyValid(this, fn)
  applyAlways: (fn) -> dvl.applyAlways(this, fn)
  pluck: (prop) -> dvl.apply(this, (d) -> d[prop])
  pluckEx: (prop) -> dvl.apply(this, (d) -> d[prop]())
  project: (fns) -> dvl.const(if @v? and fns?.down then fns.down.call(null, @v) else null)

class DVLVar
  constructor: (val) ->
    @v = val ? null
    @id = nextObjId++
    @prev = null
    @changed = false
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

  hasChanged: -> if @proj then @proj.parent.hasChanged() else @changed

  resetChanged: ->
    @changed = false
    return this

  value: (val) ->
    if arguments.length
      val = val ? null
      return this if val isnt null and @verifyFn and not @verifyFn.call(this, val)
      return this if @compareFn and @compareFn.call(this, val, @value())
      this.set(val)
      dvl.notify(this)
      return this
    else
      if @proj
        { parent, fnDown } = @proj
        pv = parent.value()
        @v = if pv? then fnDown.call(@v, pv) else null
      else
        @resolveLazy()
      return @v

  set: (val) ->
    val = val ? null
    if @proj
      { parent, fnUp } = @proj
      parent.value(fnUp.call(parent.value(), val))
      return this
    @prev = @v unless @changed
    @v = val
    @changed = true
    @lazy = null
    return this

  lazyValue: (fn) ->
    @lazy = fn
    @changed = true
    dvl.notify(this)
    return this

  update: (val) ->
    if not utilModule.isEqual(val, @v)
      this.set(val)
      dvl.notify(this)
    return this

  get: -> @value()

  getPrev: ->
    @resolveLazy()
    if @prev and @changed then @prev else @v

  notify: ->
    dvl.notify(this)

  discard: (preventSortgraph) ->
    for w in @changers
      throw new Error("Cannot find variable #{@id} from its changer #{w.id}") if w.change.indexOf(this) < 0
      w.removeChange(this, preventSortgraph)

    for w in @listeners
      throw new Error("Cannot find variable #{@id} from its listner #{w.id}") if w.listen.indexOf(this) < 0
      w.removeListen(this, preventSortgraph)

    variables.splice(variables.indexOf(this), 1)
    sortGraph() if preventSortgraph
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

  verify: ->
    if arguments.length
      @verifyFn = arguments[0]
      return this
    else
      return @verifyFn

  apply: (fn) -> dvl.apply(this, fn)
  applyValid: (fn) -> dvl.applyValid(this, fn)
  applyAlways: (fn) -> dvl.applyAlways(this, fn)
  pluck: (prop) -> dvl.apply(this, (d) -> d[prop])
  pluckEx: (prop) -> dvl.apply(this, (d) -> d[prop]())
  project: (fns) ->
    fns = dvl.wrap(fns)
    v = dvl()
    me = this
    dvl.register {
      listen: fns
      change: me
      fn: ->
        _fns = fns.value()
        if not _fns
          _fns = {
            down: -> null
            up: -> return
          }
        v.proj = {
          parent: me
          fnDown: _fns.down
          fnUp:   _fns.up
        }
        me.notify()
        return
    }
    return v


getBase = (v) ->
  while v.proj
    v = v.proj.parent
  return v


dvl.def   = (value) -> new DVLVar(value)
dvl.const = (value) -> new DVLConst(value)


# Returns weather the input is a DVL variable (or constant or not)
#
# @param v - the variable to examine
# @return {Boolean} true if v is a DVL variable or constant

dvl.knows = (v) -> v instanceof DVLVar or v instanceof DVLConst


class DVLWorker
  constructor: (@name, @ctx, @fn, @listen, @change) ->
    @id = nextObjId++
    @eventArrays = {}
    @level = workers.length # place at the end
    workers.push(this)

    # Append listen and change to variables and dependency graph
    for v in @listen
      v.listeners.push(this)
      for prevWorker in v.changers
        prevWorker.updates.add(this)

    @_redoUpdates()

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

  removeChange: (v, preventSortgraph) ->
    return this if variables.indexOf(v) < 0

    throw new Error("Cannot find variable #{v.id} in worker #{@id}'s change") if @change.indexOf(v) < 0
    @change.splice(@change.indexOf(v), 1)
    v.changers.splice(v.changers.indexOf(this), 1)
    @_redoUpdates()
    sortGraph() if not preventSortgraph
    return this

  removeListen: (v, preventSortgraph) ->
    return this if variables.indexOf(v) < 0

    throw new Error("Cannot find variable #{v.id} in worker #{@id}'s listen") if @listen.indexOf(v) < 0
    @listen.splice(@listen.indexOf(v), 1)
    v.listeners.splice(v.listeners.indexOf(this), 1)

    for prevWorker in v.changers
      prevWorker._redoUpdates()

    sortGraph() if not preventSortgraph
    return this

  _redoUpdates: ->
    @updates = new Set()
    for v in @change
      v.changers.push(this)
      for nextWorker in v.listeners
        @updates.add(nextWorker)
    return

  discard: ->
    # Find the register object
    workers.splice(workers.indexOf(this), 1)

    for v in @listen
      for prevWorker in v.changers
        prevWorker.updates.remove(this)

    for v in @change
      if v.changers.indexOf(this) > -1
        v.changers.splice(v.changers.indexOf(this), 1)

    for v in @listen
      if v.listeners.indexOf(this) > -1
        v.listeners.splice(v.listeners.indexOf(this), 1)

    sortGraph()
    @change = @listen = @updates = null # cause an error if we hit these
    @eventArrays.discard?.forEach((fn) -> fn())
    return

  on: (type, fn) ->
    @eventArrays[type] ?= []
    @eventArrays[type].push fn
    return


dvl.register = ({ctx, fn, listen, change, name, noRun}) ->
  throw new Error('cannot call register from within a notify') if curNotifyListener
  throw new TypeError('fn must be a function') if typeof(fn) != 'function'

  listen = [listen] unless utilModule.typeOf(listen) is 'array'
  change = [change] unless utilModule.typeOf(change) is 'array'

  listenConst = []
  if listen
    for v in listen
      listenConst.push v if v instanceof DVLConst

  listen = uniqById(listen).map(getBase)
  change = uniqById(change).map(getBase)

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
    v.discard(true) for k, v of @owns
    sortGraph()
    return

dvl.blockFn = ->
  switch arguments.length
    when 1 then [fn] = arguments
    when 2 then [name, fn] = arguments
    else throw "bad number of arguments"

  return (args...) ->
    curBlock = block = new DVLBlock(name, curBlock)
    ret = fn.apply(this, args)
    curBlock = block.parent
    return ret

dvl.block = ->
  switch arguments.length
    when 1 then [fn] = arguments
    when 2 then [name, fn] = arguments
    else throw "bad number of arguments"

  curBlock = block = new DVLBlock(name, curBlock)
  fn.call(this)
  curBlock = block.parent
  return block


dvl.group = (fn) -> (fnArgs...) ->
  if dvl.notify is init_notify
    captured_notifies = []
    dvl.notify = (args...) ->
      Array::push.apply(captured_notifies, args)
      return
    ret = fn.apply(this, fnArgs)
    dvl.notify = init_notify
    init_notify.apply(dvl, captured_notifies)
  else
    # this is already runing in a group or a register
    ret = fn.apply(this, fnArgs)
  return ret


dvl.wrapConstIfNeeded =
dvl.wrap = (v, name) ->
  v = null if v is undefined
  if dvl.knows(v) then v else dvl.const(v).name(name)

dvl.wrapVarIfNeeded =
dvl.wrapVar = (v, name) ->
  v = null if v is undefined
  if dvl.knows(v) then v else dvl(v).name(name)


# Returns the value of a variable if the supplied variable is DVL then it would get the value() of it
#
# @param v the value of the variable to get
# @return the value

dvl.valueOf = (v) ->
  return if dvl.knows(v) then v.value() else (v ? null)

nsId = 0
dvl.namespace = (str = 'ns') ->
  nsId++
  return str + nsId

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
dvl.sortGraph = sortGraph = (from = 0) ->
  # L <- Empty list that will contain the sorted elements
  # S <- Set of all nodes with no incoming edges
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

  # S <- Set of all nodes with no incoming edges
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
  throw new Error('bad stuff happened during a collect block') unless curCollectListener

  for v in arguments
    continue unless v instanceof DVLVar
    v = getBase(v)
    if v not in curCollectListener.change
      throw new Error("changed unregistered object #{v.id} (collect)")
    toNotify.push v

  return

dvl.notify = init_notify = ->
  lastNotifyRun = []
  visitedListener = []
  changedInNotify = []
  curNotifyListener = null

  notifyChainReset = ->
    curNotifyListener = null
    dvl.notify = init_notify
    v.resetChanged() for v in changedInNotify
    l.visited = false for l in visitedListener # reset visited
    return

  for v in arguments
    continue unless v instanceof DVLVar
    v = getBase(v)
    changedInNotify.push v
    lastNotifyRun.push v.id
    levelPriorityQueue.push l for l in v.listeners

  dvl.notify = -> # within_notify
    throw new Error('bad stuff happened within a notify block') unless curNotifyListener

    for v in arguments
      continue unless v instanceof DVLVar
      v = getBase(v)
      if v not in curNotifyListener.change
        prevStr = changedInNotify.map((v) -> v.id).join(';')
        errorMessage = "changed unregistered object #{v.id} within worker #{curNotifyListener.id} [prev:#{prevStr}]"
        notifyChainReset()
        throw new Error(errorMessage)
      changedInNotify.push v
      lastNotifyRun.push v.id
      for l in v.listeners
        if not l.visited
          levelPriorityQueue.push l

    return

  # Handle events in a BFS way
  while levelPriorityQueue.length() > 0
    curNotifyListener = levelPriorityQueue.shift()
    continue if curNotifyListener.visited
    curNotifyListener.visited = true
    visitedListener.push(curNotifyListener)
    lastNotifyRun.push(curNotifyListener.id)
    curNotifyListener.fn.apply(curNotifyListener.ctx)

  notifyChainReset()
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
      args = [] if args is undefined and not arguments[0].hasOwnProperty('args')
    when 2
      [args, fn] = arguments
    when 3
      [args, {invalid, allowNull, update}, fn] = arguments
    else
      throw "incorect number of arguments"

  fn = dvl.wrap(fn or dvl.identity)

  args = [args] unless Array.isArray(args)
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
      args = [] if args is undefined and not arguments[0].hasOwnProperty('args')
    when 2
      [args, fn] = arguments
    when 3
      [args, {update}, fn] = arguments
    else
      throw "incorect number of arguments"

  fn = dvl.wrap(fn or dvl.identity)

  args = [args] unless Array.isArray(args)
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


dvl.op = (fn) ->
  liftedFn = lift(fn)
  return (args...) ->
    args = args.map(dvl.wrap)
    out = dvl()

    dvl.register {
      listen: args
      change: [out]
      fn: ->
        out.set(liftedFn.apply(null, args.map((v) -> v.value())))
        dvl.notify(out)
        return
    }

    return out

op_to_lift = {
  'or': ->
    ret = false
    ret or= arg for arg in arguments
    return ret

  'and': ->
    ret = true
    ret and= arg for arg in arguments
    return ret

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

dvl.op[k] = dvl.op(fn) for k, fn of op_to_lift


module.exports = dvl

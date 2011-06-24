# DVL by Vadim Ogievetsky

# Check that we have everything we need.
throw 'd3 is needed for now.' unless d3
throw 'protovis is needed for now.' unless pv
throw 'jQuery is needed for now.' unless jQuery

`if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun, thisp) {
    var len = this.length;
    if (typeof fun != 'function')
      throw new TypeError();

    var res = new Array();
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }
    return res;
  };
}`

debug = ->
  return unless console?.log
  if arguments.length <= 1
    console.log(arguments[0])
  else if arguments.length == 2
    # console.log.apply does not work in chrome -> go figure
    console.log(arguments[0], arguments[1])
  else
    console.log(Array.prototype.slice.apply(arguments))
  arguments[0]

window.dvl =
  version: '0.75'
  
dvl.util = {
  uniq: (array) ->
    seen = {}
    uniq = []
    for a in array
      uniq.push a unless seen[a]
      seen[a] = 1
  
    return uniq  
  
  
  flip: (array) ->
    map = {};
    i = 0;
    while i < array.length
      map[array[i]] = i
      i++
  
    return map


  getMinMax: (input, acc) ->
    acc = ((x) -> x) unless acc
    min = +Infinity
    max = -Infinity
    minIdx = -1
    maxIdx = -1

    for d,i in input
      v = acc(d)
      if v < min
        min = v 
        minIdx = i 
      if max < v
        max = v 
        maxIdx = i

    return { min, max, minIdx, maxIdx }
}

(->
  array_ctor = (new Array).constructor
  date_ctor  = (new Date).constructor
  regex_ctor = (new RegExp).constructor
  dvl.typeOf = (v) ->
    if typeof(v) is 'object'
      return 'null'  if v == null
      return 'array' if v.constructor == array_ctor 
      return 'date'  if v.constructor == date_ctor 
      return 'object'
    else
      return 'regex' if v?.constructor == regex_ctor 
      return typeof(v)


  dvl.intersectSize = (as, bs) ->
    count = 0
    for a in as
      count += 1 if a in bs
    return count

  nextObjId = 1
  constants = {}
  variables = {}
  
  class DVLConst
    constructor: (@value, @name) ->
      @name or= 'obj'
      @id = @name + '_const' + nextObjId
      @changed = false
      constants[@id] = this
      nextObjId += 1
      return this
    
    toString: -> "|#{@id}:#{@value}|"
    set: -> this
    setLazy: -> this
    get: -> @value
    getPrev: -> @value
    hasChanged: -> @changed
    resetChanged: -> null
    notify: -> null
    remove: -> null
    push: (value) -> null
    shift: -> undefined
    gen: -> 
      that = this
      if dvl.typeOf(@value) == 'array'
        (i) -> that.value[i]
      else
        () -> that.value
    genPrev: (i) -> @gen(i)
    len: ->
      if dvl.typeOf(@value) == 'array'
        @value.length
      else
        Infinity

  dvl.const = (value, name) -> new DVLConst(value, name)
  
  class DVLDef
    constructor: (@value, @name) ->
      @name or= 'obj'
      @id = @name + '_' + nextObjId
      @prev = null
      @changed = false
      @vgen = undefined
      @vgenPrev = undefined
      @vlen = -1
      @lazy = null
      @listeners = []
      @changers = []
      variables[@id] = this
      nextObjId++
      return this
      
    resolveLazy: ->
      if @lazy
        val = @lazy()
        throw "lazy return must be new object in #{@id}" if @value == val and dvl.typeOf(val) is "object"
        @prev = val
        @value = val
      null
    
    toString: -> "|#{@id}:#{@value}|"
    hasChanged: -> @changed
    resetChanged: ->
      @changed = false
      return this
    set: (val) ->
      throw "must be new object in #{@id}" if val? and @value is val and dvl.typeOf(val) is "object"
      @prev = @value unless @changed
      @value = val
      @vgen = undefined
      @changed = true
      @lazy = null
      return this
    setLazy: (fn) ->
      @lazy = fn
      @changed = true
      return this
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
    push: (val) ->
      @value.push val
      @changed = true
      # TODO: make prev work
      null
    shift: ->
      # TODO: make prev work
      @val = @value.shift()
      @changed = true
      return val
    get: ->
      @resolveLazy()
      return @value
    getPrev: ->
      @resolveLazy()
      if @prev and @changed then @prev else @value
    gen: ->
      if @vgen != undefined
        return @vgen
      else
        that = this
        if dvl.typeOf(@value) == 'array'
          return ((i) -> that.value[i])
        else  
          return (-> that.value)
    genPrev: ->
      if @vgenPrev and @changed then @vgenPrev else @gen()
    len: ->
      if @vlen >= 0
        return @vlen
      else
        if @value?
          return if dvl.typeOf(@value) == 'array' then @value.length else Infinity
        else
          return 0
    notify: ->
      dvl.notify(this)
    remove: ->
      if @listeners.length > 0
        throw "Cannot remove variable #{@id} because it has listeners."
      if @changers.length > 0
        throw "Cannot remove variable #{@id} because it has changers."
      delete variables[id]
      return null

  dvl.def = (value, name) -> new DVLDef(value, name)
  
  dvl.knows = (v) ->
    return v and v.id and (variables[v.id] or constants[v.id])
    
  dvl.wrapConstIfNeeded = (v, name) ->
    v = null if v is undefined
    if dvl.knows(v) then v else dvl.const(v, name)

  dvl.wrapVarIfNeeded = (v, name) ->
    v = null if v is undefined
    if dvl.knows(v) then v else dvl.def(v, name)

  registerers = {}
  
  # filter out undefineds and nulls and constants also make unique
  uniqById = (vs) ->
    res = []
    if vs
      seen = {}
      for v in vs
        if v? and v.listeners and v.changers and not seen[v.id]
          seen[v.id] = true
          res.push v
    return res
  
    
  bfsUpdate = (queue) ->
    # Check for circular dependancy by making sure we never come accross any of the ids with which we started
    initIds = {}
    initIds[v.id] = 1 for v in queue
    skip = queue.length
    
    while queue.length > 0
      v = queue.shift()
      
      if skip > 0
        --skip
      else
        throw "circular dependancy detected" if initIds[v.id]
      
      for w in v.updates
        w.level = Math.max(w.level, v.level+1)
        queue.push w

    return null  


  bfsZero = (queue) ->
    while queue.length > 0
      v = queue.shift()
      for w in v.updates
        w.level = 0
        queue.push w

    return null
  
  
  class DVLFunctionObject
    constructor: (@id, @ctx, @fn, @listen, @change) ->
      @updates = []
      @level = 0
      return this
      
    addChange: (v) ->
      return this unless v.listeners and v.changers

      @change.push(v)
      v.changers.push(this)
      @updates.push(lis) for lis in v.listeners

      bfsUpdate([this])
      return this

    addListen: (v) ->
      if v.listeners and v.changers
        @listen.push(v)
        v.listeners.push(this)
        for chng in v.changers
          chng.updates.push(this)
          @level = Math.max(@level, chng.level+1)

        bfsUpdate([this])
      
      start_notify_collect(this) 
      changedSave = v.changed
      v.changed = true
      @fn.apply(@ctx)
      v.changed = changedSave
      end_notify_collect()
      return this

    remove: ->
      # Find the register object
      delete registerers[@id]
      
      bfsZero([this])

      queue = []
      for k, l of registerers
        if dvl.intersectSize(l.change, @listen) > 0
          queue.push l
          l.updates.splice(l.updates.indexOf(l), 1)

      for v in @change
        v.changers.splice(v.changers.indexOf(this), 1)

      for v in @listen
        v.listeners.splice(v.listeners.indexOf(this), 1)

      bfsUpdate(queue)
      return null
    
  
  dvl.register = ({ctx, fn, listen, change, name, force, noRun}) -> 
    throw 'cannot call register from within a notify' if curNotifyListener
    throw 'fn must be a function' if typeof(fn) != 'function'

    # Check to see if (ctx, fu) already exists, raise error for now
    for k, l of registerers
      throw 'called twice' if l.ctx == ctx and l.fn == fn      
    
    listenConst = []
    if listen
      for v in listen
        listenConst.push v if v?.id and constants[v.id]
    listen = uniqById(listen)
    change = uniqById(change)
    
    if listen.length isnt 0 or change.length isnt 0 or force
      # Make function/context holder object; set level to 0
      nextObjId += 1
      id = (name or 'fn') + '_' + nextObjId
      fo = new DVLFunctionObject(id, ctx, fn, listen, change)

      # Append listen and change to variables
      for v in listen
        throw "No such DVL variable #{id} in listeners" unless v
        v.listeners.push fo

      for v in change
        throw "No such DVL variable #{id} in changers" unless v
        v.changers.push fo  

      # Update dependancy graph
      for k, l of registerers
        if dvl.intersectSize(change, l.listen) > 0
          fo.updates.push l 
        if dvl.intersectSize(listen, l.change) > 0
          l.updates.push fo 
          fo.level = Math.max(fo.level, l.level+1)

      registerers[id] = fo
      bfsUpdate([fo])
    
    if not noRun
      # Save changes and run the function with everythign as changed.
      changedSave = []
      for l,i in listen
        changedSave[i] = l.changed
        l.changed = true
      for l in listenConst
        l.changed = true
      
      start_notify_collect(fo)
      fn.apply ctx
      end_notify_collect()
    
      for c,i in changedSave
        listen[i].changed = c
      for l in listenConst
        l.changed = false
      
    return fo 

  
  dvl.clearAll = ->
    # disolve the graph to make the garbage collection job as easy as possibe
    for k, l of registerers
      l.listen = l.change = l.updates = null
    
    for k, v of variables
      v.listeners = v.changers = null
    
    # reset everything
    nextObjId = 1
    constants = {}
    variables = {}
    registerers = {}
    null

  
  levelPriorityQueue = (->
    queue = []
    minLevel = Infinity
    len = 0
    push: (l) ->
      len += 1
      minLevel = Math.min(minLevel, l.level)
      (queue[l.level] or= []).push l
      null;
    shift: ->
      len -= 1
      while not queue[minLevel] or queue[minLevel].length == 0
        minLevel += 1
      return queue[minLevel].pop()
    length: -> len
  )() 

  curNotifyListener = null
  curCollectListener = null
  changedInNotify = null
  lastNotifyRun = null
  toNotify = null

  
  start_notify_collect = (listener) ->
    toNotify = []
    curCollectListener = listener
    dvl.notify = collect_notify
    null
    
    
  end_notify_collect = ->
    curCollectListener = null
    dvl.notify = init_notify # ToDo: possible nested notify?
    
    dvl.notify.apply(null, toNotify)
    toNotify = null
    null
    
  
  collect_notify = ->
    throw 'bad stuff happened collect' unless curCollectListener
  
    for v in arguments
      continue unless variables[v.id]
      throw "changed unregisterd object #{v.id}" if v not in curCollectListener.change
      toNotify.push v
      
    null
    
  
  within_notify = ->
    throw 'bad stuff happened within' unless curNotifyListener
    
    for v in arguments
      continue unless variables[v.id]
      throw "changed unregisterd object #{v.id}" if v not in curNotifyListener.change
      changedInNotify.push v
      lastNotifyRun.push v.id
      for l in v.listeners
        if not l.visited
          levelPriorityQueue.push l
    
    null
    
  
  init_notify = ->
    throw 'bad stuff happened init' if curNotifyListener

    lastNotifyRun = []
    changedInNotify = []
    
    for v in arguments
      continue unless variables[v.id]
      changedInNotify.push v
      lastNotifyRun.push v.id
      levelPriorityQueue.push l for l in v.listeners
    
    dvl.notify = within_notify
        
    # Handle events in a BFS way
    while levelPriorityQueue.length() > 0
      curNotifyListener = levelPriorityQueue.shift()
      continue if curNotifyListener.visited
      curNotifyListener.visited = true
      lastNotifyRun.push(curNotifyListener.id)      
      curNotifyListener.fn.apply(curNotifyListener.ctx)
    
    curNotifyListener = null
    dvl.notify = init_notify
    v.resetChanged() for v in changedInNotify
    l.visited = false for k, l of registerers # reset visited    
    null
  
  
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
    
    for k, l of registerers
      fnName = l.id;
      #fnName = fnName.replace(/_\d+/, '') unless showId
      fnName = fnName + ' (' + l.level + ')'
      # fnName += ' [[' + execOrder[l.id] + ']]' if execOrder[l.id]
      fnName = '"' + fnName + '"'
      nameMap[l.id] = fnName
    
    for id,v of variables
      varName = id
      #varName = varName.replace(/_\d+/, '') unless showId
      # varName += ' [[' + execOrder[id] + ']]' if execOrder[id]
      varName = '"' + varName + '"'
      nameMap[id] = varName
    
    dot = []
    dot.push 'digraph G {'
    dot.push '  rankdir=LR;'
    
    levels = []
    for id,v of variables
      color = if execOrder[id] then 'red' else 'black'
      dot.push "  #{nameMap[id]} [color=#{color}];"
      
    for k, l of registerers
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
    jQuery.post('http://localhost:8124/' + file, g)
    null
    
  dvl.postLatest = (file, showId) ->
    file or= 'dvl_graph_latest'
    g = dvl.graphToDot(true, showId)
    jQuery.post('http://localhost:8124/' + file, g)
    null

)()

dvl.alwaysLazy = (v, fn) ->
  return ->
    v.setLazy(fn)
    dvl.notify(v)

dvl.zero = dvl.const(0, 'zero')

dvl.null = dvl.const(null, 'null')

dvl.identity = dvl.const(((x) -> x), 'identity')


dvl.acc = (c) ->
  column = dvl.wrapConstIfNeeded(c);
  acc = dvl.def(null, "acc_#{column.get()}")
  
  makeAcc = ->
    col = column.get();
    if col?
      acc.set((d) -> d[col])
    else
      acc.set(null)
      
    dvl.notify(acc)
  
  dvl.register({fn:makeAcc, listen:[column], change:[acc], name:'make_acc'})
  return acc


# Workers # -----------------------------------------

######################################################
## 
##  A DVL object debugger
##
##  Displays the object value with a message whenever the object changes.
##
dvl.debug = () ->
  if arguments.length == 1
    obj = arguments[0]
    dbgPrint = ->
      debug obj.get()
  else
    note = arguments[0]
    obj = arguments[1]
    dbgPrint = ->
      debug note, obj.get()
  
  dvl.register({fn:dbgPrint, listen:[obj], name:'debug'})
  null


######################################################
## 
##  A DVL object invarient maintainer
##
##  Runs the supplied function on the data periodicaly on chage and throws the msg unless the function returns true.
##
##
dvl.assert = ({data, fn, msg, allowNull}) ->
  msg or= "#{obj.id} failed its assert test"
  allowNull ?= true
  
  verifyAssert ->
    d = data.get()
    if (d isnt null or allowNull) and not fn(d)
      throw msg

  dvl.register({fn:verifyAssert, listen:[obj], name:'assert_fn'})
  null
  
######################################################
## 
##  Sets up a pipline stage that automaticaly applies the given fucntion.
##  
dvl.apply = ({fn, args, name, invalid, allowNull}) ->
  fn = dvl.wrapConstIfNeeded(fn)
  throw 'dvl.apply only makes scense with at least one argument' unless args
  args = [args] unless dvl.typeOf(args) is 'array'
  invalid = if invalid? then invalid else null
  
  ret = dvl.def(invalid, name or 'apply_return')
  
  apply = ->
    f = fn.get()
    return unless f?
    send = []
    nulls = false
    for a in args
      v = a.get()
      nulls = true if v == null
      send.push v
    
    if not nulls or allowNull
      r = f.apply(null, send)
      if r != undefined
        ret.set(r)
        dvl.notify(ret)
    else
      ret.set(invalid)
      dvl.notify(ret)
    
  dvl.register({fn:apply, listen:args.concat([fn]), change:[ret], name:(name or 'apply')+'_fn'})
  return ret


dvl.random = (options) ->
  min = options.min or 0
  max = options.max or min + 10
  int = options.integer
  walk = options.walk

  random = dvl.def((max - min)/2, options.name or 'random')

  gen = ->
    if walk and walk > 0
      # do a random walk
      scale = walk * Math.abs(max - min)
      r = random.get() + scale*(2*Math.random()-1)
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
  throw 'dvl.filter: no data' unless data
  data = dvl.wrapConstIfNeeded(data)

  point = options.start or 0
  move = options.move or 1

  out = dvl.def(null, 'array_tick_data')

  gen = ->
    d = data.get()
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
  array = dvl.wrapVarIfNeeded(options.array or [], options.name or 'recorder_array')
  
  data = options.data
  fn = dvl.wrapConstIfNeeded(options.fn or dvl.identity)
  throw 'it does not make sense not to have data' unless dvl.knows(data)
  
  max = dvl.wrapConstIfNeeded(options.max or +Infinity)
  i = 0

  record = ->
    d = fn.get()(data.get())
    m = max.get()
    if d?
      if options.value
         o = {}
         o[options.value] = d
         d = o
      d[options.index] = i if options.index
      d[options.timestamp] = new Date() if options.timestamp
      array.push(d)
      
      array.shift() while m < array.get().length
      dvl.notify(array)
      i += 1

  dvl.register({fn:record, listen:[data], change:[array], name:'recorder'})
  return array


dvl.delay = ({ data, time, name }) ->
  throw 'you must provide a data' unless data
  throw 'you must provide a time' unless time
  data = dvl.wrapConstIfNeeded(data)
  time = dvl.wrapConstIfNeeded(time)
  timer = null
  out = dvl.def(data.get())
  
  timeoutFn = ->
    out.set(data.get()).notify()
    timer = null
    
  dvl.register {
    listen: [data, time]
    name: name or 'timeout'
    fn: ->
      clearTimeout(timer) if timer
      timer = null
      t = time.get()
      if t > 0
        timer = setTimeout(timeoutFn, t)
      else
        out.set(data.get()).notify()
  }
  return out
  

##-------------------------------------------------------
##
##  Asynchronous json fetcher.
##
##  Fetches json data form the server at the given url.
##  This function addes the given url to the global json getter,
##  the getter then automaticly groups requests that come from the same event cycle. 
##
## ~url:  the url to fetch.
##  type: the type of the request. [json]
##  map:  a map to apply to the recived array.
##  fn:   a function to apply to the recived input.
##
dvl.json2 = (->
  requestNumber = 0
  nextQueryId = 0
  initQueue = []
  queries = {}
  requests = {}

  maybeDone = (reqNum) ->
    request = if reqNum isnt -1 then requests[reqNum] else initQueue
    throw "no such request (#{reqNum})" unless request
    
    for q in request
      return if q.status isnt 'ready'
  
    notify = []
    for q in request
      if q.data isnt undefined
        q.res.set(q.data)
        notify.push(q.res)
        q.stauts = ''
        delete q.data
  
    delete requests[reqNum] 
    dvl.notify.apply(null, notify)
  
  getData = (data) ->
    q = this.q
    if this.url is q.url.get()
      if q.map
        m = q.map
        mappedData = []
        for d, i in data
          md = m(d)
          mappedData.push md if md isnt undefined
        data = mappedData
  
      if q.fn
        data = q.fn(data) 

      q.data = data
      q.status = 'ready'
      q.curReq = null
  
    maybeDone(this.reqNum)
  
  getError = (xhr, textStatus) ->
    return if textStatus is "abort"
    q = this.q
    if this.url is q.url.get()
      q.data = null
      q.status = 'ready'
      q.onError(textStatus) if q.onError
    maybeDone(this.reqNum)

  makeRequest = (q, reqNum) ->
    q.status = 'requesting'
    url = q.url.get()
    ctx = { q:q, reqNum:reqNum, url:url }
    if url?
      q.curReq.abort() if q.curReq
      q.curReq = jQuery.ajax
        url: url
        type: 'GET'
        dataType: 'json'
        success: getData
        error: getError
        context: ctx
    else
      setTimeout((->
        getData.call(ctx, null)
      ), 10)
      
  inputChange = ->
    bundle = []
    for id, q of queries
      continue unless q.url.hasChanged()
      if q.group.get()
        if q.status is 'virgin'
          if q.url.get()
            initQueue.push q
            makeRequest(q, -1)
          else
            q.status = ''
        else
          bundle.push(q)
      else
        ++requestNumber
        requests[requestNumber] = [q]
        makeRequest(q, requestNumber)
  
    if bundle.length > 0
      ++requestNumber
      requests[requestNumber] = bundle
      makeRequest(q, requestNumber) for q in bundle

    null

  fo = null
  addHoock = (listen, change) ->
    if fo
      fo.addListen(listen)
      inputChange()
    else
      fo = dvl.register({fn:inputChange, listen:[listen], force:true, name: 'xsr_man' })
  
    null
  

  return ({url, type, map, fn, onError, group, name}) ->
    throw 'it does not make sense to not have a url' unless url
    throw 'the map function must be non DVL variable' if map and dvl.knows(map)
    throw 'the fn function must be non DVL variable' if fn and dvl.knows(fn)
    url = dvl.wrapConstIfNeeded(url)
    type = type.get() if dvl.knows(type)
    group = dvl.wrapConstIfNeeded(if group? then group else true)
    
    nextQueryId++
    q = {
      id: nextQueryId
      url: url
      res: dvl.def(null, name or 'json_data')
      status: 'virgin'
      type: type || 'json'
      group
      onError
    }
    q.map = map if map
    q.fn = fn if fn
    queries[q.id] = q
    addHoock(url, q.res)
    return q.res
)()


##-------------------------------------------------------
##
##  Depricated
##
dvl.json = (options) ->
  options = [options] if dvl.typeOf(options) != 'array'

  listen = []
  ret = []
  query = 0
  waitForCount = {}

  gets = []
  for opt in options
    g = {}
    throw 'it does not make sense to not have a url' unless opt.url
    g.url = dvl.wrapConstIfNeeded(opt.url)
    listen.push g.url

    if opt.map
      g.map = dvl.wrapConstIfNeeded(opt.map)
      listen.push g.map
    else
      if opt.fn
        g.fn = dvl.wrapConstIfNeeded(opt.fn)
        listen.push g.fn

    g.out = dvl.def(opt.init, 'json_got') # should be 'json_get'?
    ret.push g.out

    gets.push g

  maybeStop = (q) ->
    if waitForCount[q] is 0
      delete waitForCount[q]
      notify = []
      for get in gets
        if get.got != undefined
          get.out.set(get.got)
          notify.push get.out
          delete get.got
      
      dvl.notify.apply(null, notify)

  getData = (json) ->
    g = gets[this.i]
    if g.map
      m = g.map.get()
      i = 0
      while i < json.length
        md = m(json[i])
        json[i] = md if md?
        i++
    else
      json = g.fn.get()(json) if g.fn  

    g.got = json
      
    waitForCount[this.q] -= 1
    maybeStop(this.q)
      
  query = ->
    query += 1
    waitForCount[query] = 0
    for i, g of gets
      if g.url.hasChanged()
        u = g.url.get()
        if u != null  
          jQuery.ajax
            url: u
            type: 'GET'
            dataType: 'json'
            success: getData
            error: -> debug "error in json"
            context: {i:i, q:query}
  
          waitForCount[query] += 1
        else
          g.got = null
    maybeStop(query)
    null

  dvl.register({fn:query, listen:listen, change:ret, name:'json'})
  return ret

# ToDo: rewrite this:
dvl.resizer = (sizeRef, marginRef, options) ->
  throw 'No size given' unless dvl.knows(sizeRef)
  marginDefault = {top: 0, bottom: 0, left: 0, right: 0}
  
  if options
    if options.width
      fw = if dvl.typeOf(options.width) is 'function' then options.width else dvl.identity
    if options.height
      fh = if dvl.typeOf(options.height) is 'function' then options.height else dvl.identity
  else
    fw = ident
    fh = ident
    
  onResize = ->
    margin = if marginRef then marginRef.get() else marginDefault
    if options.selector
      e = jQuery(options.selector)
      width  = e.width()
      height = e.height()
    else
      width  = document.body.clientWidth 
      height = document.body.clientHeight
    width  = fw(width ) - margin.right - margin.left   if fw
    height = fh(height) - margin.top   - margin.bottom if fh
    width  = Math.max(width,  options.minWidth)  if options.minWidth
    width  = Math.min(width,  options.maxWidth)  if options.maxWidth
    height = Math.max(height, options.minHeight) if options.minHeight
    height = Math.min(height, options.maxHeight) if options.maxHeight
    sizeRef.set({ width: width, height: height })
    dvl.notify(sizeRef)
  
  d3.select(window).on('resize', onResize)
  onResize()
  null



dvl.format = (string, subs) ->
  out = dvl.def(null, 'formated_out')

  for s in subs
    if not dvl.knows(s)
      s.fn = dvl.wrapConstIfNeeded(s.fn) if s.fn
      s.data = dvl.wrapConstIfNeeded(s.data)
  
  makeString = ->
    args = [string]
    invalid = false
    for s in subs
      if dvl.knows(s)
        v = s.get()
        if v == null
          invalid = true
          break
        args.push v
      else
        v = s.data.get()
        if v == null
          invalid = true
          break
        v = s.fn.get()(v) if s.fn
        args.push v
        
    out.set(if invalid then null else sprintf.apply(null, args))
    dvl.notify(out)
    
  list = []
  for s in subs
    if dvl.knows(s)
      list.push s
    else
      list.push s.data
  
  dvl.register({fn:makeString, listen:list, change:[out], name:'formater'})
  return out

  
dvl.hasher = (obj) ->
  updateHash = ->
    h = obj.get()
    window.location.hash = h unless window.location.hash == h
    
  dvl.register({fn:updateHash, listen:[obj], name:'hash_changer'})
  null
  
# Scales # ------------------------------------------------

dvl.scale = {}

(->
  dvl.scale.linear = (options) ->
    throw 'no options in scale' unless options
    name = options.name or 'linear_scale'

    rangeFrom = options.rangeFrom || 0
    rangeFrom = dvl.wrapConstIfNeeded(rangeFrom)

    rangeTo = options.rangeTo || 0
    rangeTo = dvl.wrapConstIfNeeded(rangeTo)
    
    padding = options.padding || 0
    
    numTicks = options.numTicks || 10
    numTicks = dvl.wrapConstIfNeeded(numTicks)

    optDomain = options.domain
    throw 'no domain object' unless optDomain

    switch dvl.typeOf optDomain
      when 'array'
        throw 'empty domain given to scale' unless optDomain.length > 0
      when 'object'
        optDomain = [optDomain]
      else
        throw 'invalid domian type'

    domainFrom = null
    domainTo   = null
    scaleRef  = dvl.def(null, name + '_fn')
    invertRef = dvl.def(null, name + '_invert')
    ticksRef  = dvl.def(null, name + '_ticks')
    formatRef = dvl.def(null, name + '_format')

    makeScaleFn = () ->
      isColor = typeof(rangeFrom.get()) == 'string'
      rf = rangeFrom.get()
      rt = rangeTo.get()
      if not isColor
        if rt > rf
          rf += padding
          rt -= padding
        else    
          rf -= padding
          rt += padding
      s = pv.Scale.linear().domain(domainFrom, domainTo).range(rf, rt)
      if isColor
        # We are mapping colors so extract the color form the object
        scaleRef.set((x) -> s(x).color)
      else
        scaleRef.set(s)
        
      invertRef.set(s.invert)
      ticksRef.setLazy(-> s.ticks(numTicks.get()))
      formatRef.set(s.tickFormat)
      dvl.notify(scaleRef, invertRef, ticksRef, formatRef)
      null

    makeScaleFnSingle = (d) ->
      isColor = typeof(rangeFrom.get()) == 'string'
      rf = rangeFrom.get()
      rt = rangeTo.get()
      if not isColor
        if rt > rf
          rf += padding
          rt -= padding
        else    
          rf -= padding
          rt += padding
      avg = (rf + rt) / 2
      scaleRef.set(-> avg)
      invertRef.set(-> d)
      ticksRef.set([d])
      formatRef.set((x) -> '')
      dvl.notify(scaleRef, invertRef, ticksRef, formatRef)
      null

    makeScaleFnEmpty = () ->
      scaleRef.set(null)
      invertRef.set(null)
      ticksRef.set(null)
      formatRef.set(null)
      dvl.notify(scaleRef, invertRef, ticksRef, formatRef)
      null

    updateData = () -> 
      min = +Infinity
      max = -Infinity
      for dom in optDomain
        if dom.data
          data = dom.data.get()

          if data != null
            acc = dom.acc || dvl.identity
            a = acc.get()
            
            if dvl.typeOf(data) isnt 'array'
              # ToDo: make this nicer
              data = a(data)
              a = (x) -> x
              
            if data.length > 0            
              if dom.sorted
                d0 = a(data[0], 0)
                dn = a(data[data.length - 1], data.length - 1)      
                min = d0 if d0 < min
                min = dn if dn < min
                max = d0 if max < d0
                max = dn if max < dn
              else
                mm = dvl.util.getMinMax(data, a)
                min = mm.min if mm.min < min
                max = mm.max if max < mm.max
                 
        else
          f = dom.from.get()
          t = dom.to.get()
          if f? and t?
            min = f if f < min
            max = t if max < t

      if options.anchor
        min = 0 if 0 < min
        max = 0 if max < 0
        
      if options.scaleMin != undefined
        min *= options.scaleMin
        
      if options.scaleMax != undefined
        max *= options.scaleMax

      if min < max
        if domainFrom != min or domainTo != max
          domainFrom = min
          domainTo = max
          makeScaleFn()
      else if min == max
        makeScaleFnSingle(min)
      else 
        domainFrom = NaN
        domainTo = NaN
        makeScaleFnEmpty()

      null

    listenData = []
    for dom in optDomain
      if dom.data
        listenData.push dom.data
        listenData.push dom.acc
      else
        listenData.push dom.from
        listenData.push dom.to
    
    change = [scaleRef, invertRef, ticksRef, formatRef]
    dvl.register({fn:makeScaleFn, listen:[rangeFrom, rangeTo, numTicks], change:change, name:name + '_range_change', noRun:true})
    dvl.register({fn:updateData, listen:listenData, change:change, name:name + '_data_change'})

    # return
    scale:  scaleRef
    invert: invertRef
    ticks:  ticksRef
    format: formatRef


  dvl.scale.ordinal = (options) ->
    throw 'no options in scale' unless options
    name = options.name or 'ordinal_scale'

    rangeFrom = options.rangeFrom || 0
    rangeFrom = dvl.wrapConstIfNeeded(rangeFrom)

    rangeTo = options.rangeTo || 0
    rangeTo = dvl.wrapConstIfNeeded(rangeTo)

    padding = options.padding || 0

    optDomain = options.domain
    throw 'no domain object' unless optDomain

    domain = null
    scaleRef  = dvl.def(null, name + '_fn')
    ticksRef  = dvl.def(null, name + '_ticks')
    formatRef = dvl.def(null, name + '_format')
    bandRef   = dvl.def(0,    name + '_band')

    makeScaleFn = () ->
      rf = rangeFrom.get()
      rt = rangeTo.get()
      if rt > rf
        rf += padding
        rt -= padding
      else    
        rf -= padding
        rt += padding
      s = pv.Scale.ordinal().domain(domain).split(rf, rt)
      scaleRef.set(s)
      ticksRef.set(domain)
      formatRef.set(s.tickFormat)
      bandRef.set(Math.abs(rt - rf) / domain.length)
      dvl.notify(scaleRef, ticksRef, formatRef, bandRef)
      null

    makeScaleFnEmpty = () ->
      scaleRef.set(null)
      ticksRef.set(null)
      formatRef.set(null)
      bandRef.set(0)
      dvl.notify(scaleRef, ticksRef, formatRef, bandRef)
      null

    updateData = () -> 
      domain = optDomain.data.get()
      
      if not domain
        makeScaleFnEmpty()
        return
    
      if optDomain.acc
        a = optDomain.acc.get()
        domain = domain.map(a);

      if optDomain.sort
        # Sorting changes the data in place so copy the data if we have not done so already 
        domain = domain.slice() unless optDomain.acc or optDomain.uniq
        domain.sort()

      if optDomain.uniq
        domain = dvl.util.uniq(domain);

      if domain.length > 0
        makeScaleFn()
      else
        makeScaleFnEmpty()

      null

    dvl.register({fn:makeScaleFn, listen:[rangeFrom, rangeTo], change:[scaleRef, ticksRef, formatRef, bandRef], name:name + '_range_change', noRun:true})
    dvl.register({fn:updateData, listen:[optDomain.data, optDomain.acc], change:[scaleRef, ticksRef, formatRef, bandRef], name:name + '_data_change'})
    
    # return 
    scale: scaleRef
    ticks: ticksRef
    format: formatRef
    band: bandRef
)()

dvl.dataMapper 

# Gens # --------------------------------------------------

dvl.gen = {}

dvl.gen.fromFn = (fn) ->
  gen = dvl.def(null, 'fn_generator')
  gen.setGen(fn, Infinity)
  return gen

dvl.gen.fromArray = (data, acc, fn) ->
  data = dvl.wrapConstIfNeeded(data)
  acc  = dvl.wrapConstIfNeeded(acc or dvl.identity)
  fn   = dvl.wrapConstIfNeeded(fn or dvl.identity)

  gen = dvl.def(null, 'array_generator')
  
  d = []
  makeGen = ->
    a = acc.get()
    f = fn.get()
    d = data.get()
    if a? and f? and d? and d.length > 0
      g = (i) ->
        i = i % d.length
        f(a(d[i], i))
      
      gen.setGen(g, data.get().length)
    else
      gen.setGen(null)
      
    dvl.notify(gen)

  dvl.register({fn:makeGen, listen:[data, acc, fn], change:[gen], name:'array_make_gen'})
  return gen

dvl.gen.fromRowData = dvl.gen.fromArray
dvl.gen.fromColumnData = (data, acc, fn) ->
  data = dvl.wrapConstIfNeeded(data)
  acc  = dvl.wrapConstIfNeeded(acc or dvl.identity)
  fn   = dvl.wrapConstIfNeeded(fn or dvl.identity)

  gen = dvl.def(null, 'array_generator')
  
  d = []
  makeGen = ->
    a = acc.get()
    f = fn.get()
    dObj = data.get()
    if a? and f? and dObj? and d = a(dObj)
      g = (i) ->
        i = i % d.length
        f(d[i])
      
      gen.setGen(g, d.length)
    else
      gen.setGen(null)
      
    dvl.notify(gen)

  dvl.register({fn:makeGen, listen:[data, acc, fn], change:[gen], name:'array_make_gen'})
  return gen


dvl.gen.equal = (genA, genB, retTrue, retFalse) ->
  retTrue  = true  if retTrue  is undefined
  retFalse = false if retFalse is undefined
  retTrue  = dvl.wrapConstIfNeeded(retTrue)
  retFalse = dvl.wrapConstIfNeeded(retFalse)
  
  gen = dvl.def(null, 'equal_generator')
  
  makeGen = ->
    a = genA.gen()
    b = genB.gen()
    ha = a?
    hb = b?
    rtg = retTrue.gen()
    rfg = retFalse.gen()
    rtl = retTrue.len()
    rfl = retFalse.len()
    if ha and ha
      lenA = genA.len() || Infinity
      lenB = genB.len() || Infinity
      gen.setGen(((i) -> if a(i) == b(i) then rtg(i) else rfg(i)), Math.min(lenA, lenB, rtl, rfl))
    else if not ha and not hb
      gen.setGen(rtg, rtl)
    else
      gen.setGen(rfg, rfl)
    
    dvl.notify(gen)
  
  dvl.register({fn:makeGen, listen:[genA, genB, retTrue, retFalse], change:[gen], name:'equal_make_gen'})
  return gen
    

generator_maker_maker = (combiner, name) ->
  return () ->
    args = Array.prototype.slice.apply(arguments)
    gen = dvl.def(null, name + '_generator')

    makeGen = ->
      valid = (args.length > 0)
      gens = []
      lens = []
      for arg in args
        arg_gen = arg.gen()
        if arg_gen is null
          valid = false
          break
        gens.push arg_gen
        lens.push arg.len()
        
      if valid
        g = (i) ->
          gis = []
          gis.push cgen(i) for cgen in gens
          return combiner.apply(null, gis)

        gen.setGen(g, Math.min.apply(null, lens))
      else
        gen.setGen(null)

      dvl.notify(gen)
      null

    dvl.register({fn:makeGen, listen:args, change:[gen], name:name + '_make_gen'})
    return gen

  
dvl.gen.add = generator_maker_maker(((a,b,c) -> a+b+(c||0)), 'add')
dvl.gen.sub = generator_maker_maker(((a,b,c) -> a-b-(c||0)), 'sub')

# SVG # ---------------------------------------------------

dvl.svg = {}

(->
  processOptions = (options, mySvg, myClass) ->
    throw 'No panel defined.' unless options.panel
    out = 
      mySvg: mySvg
      myClass: myClass
      
    if options
      out.duration = dvl.wrapConstIfNeeded(options.duration or dvl.zero)
      out.classStr = options.classStr
      out.clip = options.clip
      out.on = options.on

    return out
    
  
  processProps = (props) ->
    throw 'No props defined.' unless props
    p = {}
    for k, v of props
      p[k] = dvl.wrapConstIfNeeded(v)
    return p


  gen_subHalf   = generator_maker_maker(((a,b) -> a-b/2), 'sub_half')
  gen_subDouble = generator_maker_maker(((a,b) -> (a-b)*2), 'sub_double')

  processDim2 = (props, panelWidth, left, right) ->
    if not props[left]
      if props[right]
        props[left] = dvl.gen.sub(panelWidth, props[right]) 
      else
        props[left] = dvl.zero
    #else
    #  We have everything we need to know
        
    null
          
    
  processDim3 = (props, panelWidth, left, width, right) ->
    if props[left]
      if not props[width]
        props[width] = dvl.gen.sub(panelWidth, props[left], props[right])
      #else
      #  We have everything we need to know 
    else
      if props[width]
        props[left] = dvl.gen.sub(panelWidth, props[width], props[right]) 
      else
        props[left] = dvl.zero
        props[width] = panelWidth
    
    null
    
    
  processDim4 = (props, panelWidth, left, width, right, center) ->
    if props[left]
      if not props[width]
        if props[center]
          props[width] = gen_subDouble(props[canter], props[left])
        else
          props[width] = dvl.gen.sub(panelWidth, props[left], props[right])   
      #else
      #  We have everything we need to know
    else
      if props[width]
        if props[center]
          props[left] = gen_subHalf(props[center], props[width])
        else
          props[left] = dvl.gen.sub(panelWidth, props[width], props[right])
      else
        if props[center]
          props[left] = dvl.gen.sub(props[center], dvl.const(10))
          props[width] = dvl.const(20)
        else
          props[left] = dvl.zero
          props[width] = panelWidth

    null
  
  
  removeUndefined = (obj) ->
    for k,p of obj
      delete obj[k] if p is undefined
    obj
      
    
  initGroup = (panel, options) ->
    g = panel.g.append('svg:g')
    g.attr('class', options.classStr) is options.classStr
    #g.attr('transform', 'translate(0,0)')
    #g.attr('width', panel.width.get())
    #g.attr('height', panel.height.get())
    
    return g
    
    
  initClip = (panel, g, options) ->
    if options.clip
      cpid = getNextClipPathId()
      cp = g.append('svg:clipPath')
        .attr('id', cpid)
        .append('svg:rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', panel.width.gen())
        .attr('height', panel.height.gen())
    
      g.attr('clip-path', 'url(#' + cpid + ')')
      return cp
    else
      return null

  calcLength = (props) ->
    length = +Infinity
    for what, gen of props
      l = gen.len()
      length = l if l < length
    return if length == Infinity then 1 else length
    
  
  nextClipPathId = 0
  getNextClipPathId = ->
    nextClipPathId += 1
    return 'cp_' + nextClipPathId
  
  getNodeKey = (n) ->
    n.getAttribute('id')
  
  
  selectEnterExit = (g, options, props, numMarks) ->
    if props.key and props.key.gen()
      key_gen = props.key.gen()
      id_gen = (i) -> 'i_' + String(key_gen(i)).replace(/[^\w-:.]/g, '')
      join =
        dataKey: id_gen
        nodeKey: getNodeKey
    else
      join = null
    
    sel = g.selectAll("#{options.mySvg}.#{options.myClass}").data(pv.range(0, numMarks), join)
    
    sel.exit().remove()

    m = sel.enter("svg:#{options.mySvg}")
    m.attr('id', id_gen) if props.key and props.key.gen()
    m.attr('class', options.myClass)
    
    if options.on
      m.on(what, onFn) for what, onFn of options.on

    return m

    
  reselectUpdate = (g, options, duration) ->
    m = g.selectAll("#{options.mySvg}.#{options.myClass}")
    m = m.transition().duration(duration) if duration > 0
    return m

  
  makeAnchors = (anchors, options) ->
    anchor = []
    for a, info of anchors
      av = dvl.def(null, "#{options.myClass}_anchor_#{a}") 
      anchor[a] = av
      lazy = dvl.alwaysLazy(av, info.calc)
      dvl.register({fn:lazy, listen:info.dep, change:[av], name:"lazy_anchor_#{a}"})
      
    return anchor
    
  
  dvl.svg.canvas = (options) ->
    selector = options.selector
    throw 'no selector' unless selector
    sizeRef = options.size
    marginRef = options.margin
    sizeDef = { width: 600, height: 400 }
    marginDef = { top: 0, bottom: 0, left: 0, right: 0 }

    pWidth  = dvl.def(0, 'svg_panel_width')
    pHeight = dvl.def(0, 'svg_panel_height')

    svg = d3.select(selector).append('svg:svg')
    svg.attr('class', options.classStr) if options.classStr
    vis = svg.append('svg:g').attr('class', 'main')
    bg  = vis.append('svg:rect').attr('class', 'background')
      
    if options.on
      bg.on(what, onFn) for what, onFn of options.on 

    resize = ->
      size = if sizeRef then sizeRef.get() else sizeDef
      margin = if marginRef then marginRef.get() else marginDef

      w = size.width  - margin.left - margin.right
      h = size.height - margin.top  - margin.bottom
      notify = []
      if pWidth.get() != w
        pWidth.set(w)
        notify.push pWidth
      if pHeight != h
        pHeight.set(h)
        notify.push pHeight

      dvl.notify.apply(null, notify)

      svg
        .attr('width',  size.width)
        .attr('height', size.height)

      vis
        .attr('transform', "translate(#{margin.left},#{margin.top})")
        .attr('width', w)
        .attr('height', h)

      bg
        .attr('width', w)
        .attr('height', h)

    dvl.register({fn:resize, listen:[sizeRef, marginRef], change:[pWidth, pHeight], name:'canvas_resize'})

    g: vis
    width: pWidth
    height: pHeight


  dvl.svg.mouse = (panel) ->
    x = dvl.def(null, 'mouse_x')
    y = dvl.def(null, 'mouse_y')
    
    recorder = ->
      m = d3.svg.mouse(panel.g.node())
      w = panel.width.get()
      h = panel.height.get()
      mx = m[0]
      my = m[1]
      if 0 <= mx <= w and 0 <= my <= h
        x.set(mx)
        y.set(my)
      else
        x.set(null)
        y.set(null)
        
      dvl.notify(x, y)
    
    panel.g.on('mousemove', recorder).on('mouseout', recorder)

    return { x, y }
  
  
  listen_attr = {}
  update_attr = {}
  

  listen_attr.panels = ['left', 'top', 'width', 'height']
  update_attr.panels = (m, p, prev) ->
    gen = if prev then 'genPrev' else 'gen'

    left = p.left
    top  = p.top
    if prev or left.hasChanged() or top.hasChanged() 
      left_gen = left[gen]()
      top_gen  = top[gen]()
      m.attr('transform', ((i) -> "translate(#{left_gen(i)},#{top_gen(i)})"))
    
    width = p.width
    m.attr('width',  width[gen]())  if width and (prev or width.hasChanged())
    
    height = p.height
    m.attr('height', height[gen]()) if height and (prev or height.hasChanged())
    null
      
  dvl.svg.panels = (options) ->
    o = processOptions(options, 'g', 'panels')
    o.clip = false unless o.clip?
    p = processProps(options.props)
    panel = options.panel
    processDim3(p, panel.width, 'left', 'width', 'right')
    processDim3(p, panel.height, 'top', 'height', 'bottom')
    g = initGroup(panel, o)
    clip = initClip(panel, g, o)
    
    content = options.content
    
    widths = []
    heights = []
    
    render = ->
      len = calcLength(p)

      if len > 0
        m = selectEnterExit(g, o, p, len)
        update_attr[o.myClass](m, p, true)

        dimChange = panel.width.hasChanged() or panel.height.hasChanged()
        if dimChange
          clip.attr('width', panel.width.get()).attr('height', panel.height.get()) if clip
          dur = 0
        else
          dur = o.duration.get()
    
        m = g.selectAll('g')
        update_attr[o.myClass](m, p)
        
        ms = m[0]
        msLen = ms.length
        i = 0
        wg = p.width.gen()
        hg = p.height.gen()
        while i < msLen
          if not widths[i]
            widths[i]  = dvl.def(wg(i), 'width_'  + i)
            heights[i] = dvl.def(hg(i), 'height_' + i)
            
          content(i, {
            g: d3.select(ms[i])
            width: widths[i]
            height: heights[i]
          })
          i++
      
        g.style('display', null)
      else
        g.style('display', 'none')
        
      null
    
    listen = [panel.width, panel.height]
    listen.push p[k] for k in listen_attr[o.myClass]
    dvl.register({fn:render, listen:listen, name:'panels_render'})
    null
    

  listen_attr.line = ['left', 'top', 'stroke']
  update_attr.line = (m, p, prev) ->
    gen = if prev then 'genPrev' else 'gen'

    left = p.left           
    if (prev or left.hasChanged()) 
      left_gen = left[gen]()
      m.attr('x1', left_gen)
      m.attr('x2', ((i) -> left_gen(i+1)))

    top = p.top
    if (prev or top.hasChanged())
      top_gen = top[gen]()  
      m.attr('y1', top_gen)
      m.attr('y2', ((i) -> top_gen(i+1)))

    stroke = p.stroke
    m.style('stroke', stroke[gen]()) if stroke and (prev or stroke.hasChanged())
    null

  dvl.svg.line = (options) ->
    o = processOptions(options, 'line', 'line')
    o.clip = true unless o.clip?
    p = processProps(options.props)
    panel = options.panel
    processDim2(p, panel.width, 'left', 'right')
    processDim2(p, panel.height, 'top', 'bottom')
    g = initGroup(panel, o)
    clip = initClip(panel, g, o)

    anchors =
      midpoint:
        dep: [p.left, p.top]
        calc: ->
          length = calcLength(p)
          x = p.left.gen()
          y = p.top.gen()
          as = []
          i = 0
          while i < length-1 
            as.push { x:(x(i) + x(i+1)) / 2, y:(y(i) + y(i+1)) / 2 }
            i += 1
          return as
        
    render = ->
      len = Math.max(0, calcLength(p) - 1)
          
      m = selectEnterExit(g, o, p, len)
      update_attr[o.myClass](m, p, true)

      if panel.width.hasChanged() or panel.height.hasChanged()
        clip.attr('width', panel.width.get()).attr('height', panel.height.get()) if clip
        dur = 0
      else
        dur = o.duration.get()

      m = reselectUpdate(g, o, dur)
      update_attr[o.myClass](m, p)  
        
      null

    listen = [panel.width, panel.height]
    listen.push p[k] for k in listen_attr[o.myClass]
    dvl.register({fn:render, listen:listen, name:'render_line'})
    makeAnchors(anchors, o)


  dvl.svg.area = (options) ->
    o = processOptions(options, 'path', 'area')
    o.clip = false unless o.clip?
    p = processProps(options.props)
    processDim3(p, panel.width, 'left', 'width', 'right')
    processDim3(p, panel.height, 'top', 'height', 'bottom')
    panel = options.panel
    g = initGroup(panel, o)
    clip = initClip(panel, g, o)

    anchors =
      midpoint:
        dep: [p.x, p.y]
        calc: ->
          length = calcLength(p)
          x = p.x.gen()
          y = p.y.gen()
          as = []
          i = 0
          while i < length-1 
            as.push { x:(x(i) + x(i+1)) / 2, y:(y(i) + y(i+1)) / 2 }
            i += 1
          return as

    a = g.append('svg:path')
      .attr('fill', "#ff0000")

    render = ->
      len = calcLength(p)
      x = p.x.gen()
      y = p.y.gen()

      if len > 0 and x and y
        dimChange = panel.width.hasChanged() or panel.height.hasChanged()
        clip.attr('width', panel.width.get()).attr('height', panel.height.get()) if clip
        dur = if dimChange then 0 else o.duration.get()

        af = d3.svg.area()
            .x(x)
            .y1(y)
            .y0(panel.height.gen())
        
        a.attr('d', af(d3.range(len))); 

        g.style('display', null)
      else
        g.style('display', 'none')

      null

    dvl.register({fn:render, listen:[panel.width, panel.height, p.x, p.y], name:'render_area'})
    makeAnchors(anchors, o)

      
  listen_attr.lines = ['left1', 'left2', 'top1', 'top2', 'stroke']
  update_attr.lines = (m, p, prev) ->
    gen = if prev then 'genPrev' else 'gen'
    
    left1 = p.left1            
    m.attr('x1', left1[gen]()) if (prev or left1.hasChanged())
                               
    left2 = p.left2            
    m.attr('x2', left2[gen]()) if (prev or left2.hasChanged())
                               
    top1 = p.top1              
    m.attr('y1', top1[gen]()) if (prev or top1.hasChanged())
                               
    top2 = p.top2              
    m.attr('y2', top2[gen]()) if (prev or top2.hasChanged())

    stroke = p.stroke
    m.style('stroke', stroke[gen]()) if stroke and (prev or stroke.hasChanged())
    null

  dvl.svg.lines = (options) ->  
    o = processOptions(options, 'line', 'lines')
    o.clip = true unless o.clip?
    p = processProps(options.props)
    panel = options.panel
    p.left1 or= p.left
    p.left2 or= p.left
    p.right1 or= p.right
    p.right2 or= p.right
    p.top1 or= p.top
    p.top2 or= p.top
    p.bottom1 or= p.bottom
    p.bottom2 or= p.bottom
    removeUndefined(p) 
    processDim2(p, panel.width, 'left1', 'right1')
    processDim2(p, panel.width, 'left2', 'right2')
    processDim2(p, panel.height, 'top1', 'bottom1')
    processDim2(p, panel.height, 'top2', 'bottom2')
    g = initGroup(panel, o)
    clip = initClip(panel, g, o)
  
    anchors =
      midpoint1:
        dep: [p.left1, p.top1]
        calc: ->
          length = calcLength(p)
          x = p.left1.gen()
          y = p.top1.gen()
          as = []
          i = 0
          while i < length-1 
            as.push { x:(x(i) + x(i+1)) / 2, y:(y(i) + y(i+1)) / 2 }
            i += 1
          return as
        
      midpoint2:
        dep: [p.left2, p.top2]
        calc: ->
          length = calcLength(p)
          x = p.left2.gen()
          y = p.top2.gen()
          as = []
          i = 0
          while i < length-1 
            as.push { x:(x(i) + x(i+1)) / 2, y:(y(i) + y(i+1)) / 2 }
            i += 1
          return as
        
      center: 
        dep: [p.left1, p.left2, p.top1, p.top2]
        calc: ->
          length = calcLength(p)
          x1 = p.left1.gen()
          y1 = p.top1.gen()
          x2 = p.left2.gen()
          y2 = p.top2.gen()
          as = []
          i = 0
          while i < length 
            as.push { x:(x1(i) + x2(i)) / 2, y:(y1(i) + y2(i)) / 2 }
            i += 1
          return as

    render = ->
      len = calcLength(p)
      
      m = selectEnterExit(g, o, p, len)
      update_attr[o.myClass](m, p, true)

      if panel.width.hasChanged() or panel.height.hasChanged()
        clip.attr('width', panel.width.get()).attr('height', panel.height.get()) if clip
        dur = 0
      else
        dur = o.duration.get()
      
      m = reselectUpdate(g, o, dur)
      update_attr[o.myClass](m, p)
      null

    listen = [panel.width, panel.height]
    listen.push p[k] for k in listen_attr[o.myClass]
    dvl.register({fn:render, listen:listen, name:'lines_render'})
    makeAnchors(anchors, o)


  listen_attr.bars = ['left', 'top', 'width', 'height', 'fill', 'stroke']
  update_attr.bars = (m, p, prev) ->
    gen = if prev then 'genPrev' else 'gen'

    left = p.left
    top  = p.top
    if prev or left.hasChanged() or top.hasChanged() 
      left_gen = left[gen]()
      top_gen  = top[gen]()
      m.attr('transform', ((i) -> "translate(#{left_gen(i)},#{top_gen(i)})"))

    width = p.width
    m.attr('width',  width[gen]()) if width and (prev or width.hasChanged())

    height = p.height
    m.attr('height', height[gen]()) if height and (prev or height.hasChanged())
    
    fill = p.fill
    m.style('fill', fill[gen]()) if fill and (prev or fill.hasChanged())
    
    stroke = p.stroke
    m.style('stroke', stroke[gen]()) if stroke and (prev or stroke.hasChanged())
    null

  dvl.svg.bars = (options) ->     
    o = processOptions(options, 'rect', 'bars')
    o.clip = true unless o.clip?
    p = processProps(options.props)
    panel = options.panel
    processDim4(p, panel.width, 'left', 'width', 'right', 'centerX')
    processDim4(p, panel.height, 'top', 'height', 'bottom', 'centerY')
    g = initGroup(panel, o)
    clip = initClip(panel, g, o)
      
    anchors =
      center: 
        dep: [p.left, p.top, p.width, p.height]
        calc: ->
          length = calcLength(p)
          x = p.left.gen()
          y = p.top.gen()
          w = p.width.gen()
          h = p.height.gen()
          as = []
          i = 0
          while i < length 
            as.push { x:x(i) + w(i) / 2, y: y(i) + h(i) / 2 }
            i += 1
          return as

    render = ->
      len = calcLength(p)

      if len > 0
        m = selectEnterExit(g, o, p, len)
        update_attr[o.myClass](m, p, true)

        dimChange = panel.width.hasChanged() or panel.height.hasChanged()
        if dimChange
          clip.attr('width', panel.width.get()).attr('height', panel.height.get()) if clip
          dur = 0
        else
          dur = o.duration.get()
    
        m = reselectUpdate(g, o, dur)
        update_attr[o.myClass](m, p)
      
        g.style('display', null)
      else
        g.style('display', 'none')
        
      null
    
    listen = [panel.width, panel.height]
    listen.push p[k] for k in listen_attr[o.myClass]
    dvl.register({fn:render, listen:listen, name:'bars_render'})
    makeAnchors(anchors, o)
    

  listen_attr.labels = ['left', 'top', 'baseline', 'align', 'text', 'color']
  update_attr.labels = (m, p, prev) ->
    gen = if prev then 'genPrev' else 'gen'

    left = p.left
    top  = p.top
    angle = p.angle
    if prev or left.hasChanged() or top.hasChanged() or (angle and angle.hasChanged())
      left_gen = left[gen]()
      top_gen  = top[gen]()
      if angle
        angle_gen = angle[gen]()
        m.attr('transform', ((i) -> "translate(#{left_gen(i)},#{top_gen(i)}) rotate(#{angle_gen(i)})"))
      else
        m.attr('transform', ((i) -> "translate(#{left_gen(i)},#{top_gen(i)})"))

    baseline = p.baseline
    if baseline and (prev or baseline.hasChanged())
      baseline_gen = baseline[gen]() 
      m.attr('dy', ((i) -> 
                    pi = baseline_gen(i)
                    if pi is 'top' then '.71em' else if pi is 'middle' then '.35em' else null))

    align = p.align
    m.attr('text-anchor', align[gen]()) if align and (prev or align.hasChanged())
    
    color = p.color
    m.style('fill', color[gen]()) if color and (prev or color.hasChanged())
    null

  dvl.svg.labels = (options) ->
    o = processOptions(options, 'text', 'labels')
    o.clip = false unless o.clip?
    p = processProps(options.props)
    panel = options.panel
    processDim2(p, panel.width, 'left', 'right')
    processDim2(p, panel.height, 'top', 'bottom')
    g = initGroup(panel, o)
    clip = initClip(panel, g, o)

    anchors = {}

    render = ->
      len = calcLength(p)
      
      if len > 0
        text = p.text.gen()
        m = selectEnterExit(g, o, p, len)
        update_attr[o.myClass](m, p, true)
        m.text(text) 

        if panel.width.hasChanged() or panel.height.hasChanged()
          clip.attr('width', panel.width.get()).attr('height', panel.height.get()) if clip
          dur = 0
        else
          dur = o.duration.get()
      
        #m = reselectUpdate(g, o, dur)
        m = g.selectAll("#{o.mySvg}.#{o.myClass}")
        m.text(text) if p.text.hasChanged()
        m = m.transition().duration(dur) if dur > 0
        update_attr[o.myClass](m, p)
      
        g.style('display', null)
      else
        g.style('display', 'none')
      
      null

    listen = [panel.width, panel.height]
    listen.push p[k] for k in listen_attr[o.myClass]
    dvl.register({fn:render, listen:listen, name:'labels_render'})
    makeAnchors(anchors, o)
  
  
  listen_attr.dots = ['left', 'top', 'radius', 'fill', 'stroke']
  update_attr.dots = (m, p, prev) ->
    gen = if prev then 'genPrev' else 'gen'

    left = p.left
    m.attr('cx',  left[gen]()) if left and (prev or left.hasChanged())

    top = p.top
    m.attr('cy',  top[gen]()) if top and (prev or top.hasChanged())

    radius = p.radius
    m.attr('r',  radius[gen]()) if radius and (prev or radius.hasChanged())

    fill = p.fill
    m.style('fill', fill[gen]()) if fill and (prev or fill.hasChanged())

    stroke = p.stroke
    m.style('stroke', stroke[gen]()) if stroke and (prev or stroke.hasChanged())
    null
    
  dvl.svg.dots = (options) ->
    o = processOptions(options, 'circle', 'dots')
    o.clip = true unless o.clip?
    p = processProps(options.props)
    panel = options.panel
    processDim2(p, panel.width, 'left', 'right')
    processDim2(p, panel.height, 'top', 'bottom')
    g = initGroup(panel, o)
    clip = initClip(panel, g, o)

    anchors =
      left:
        dep: [p.left, p.top, p.radius]
        calc: ->
          length = calcLength(p)
          x = p.left.gen()
          y = p.top.gen()
          r = p.radius.gen()
          as = []
          i = 0
          while i < length
            as.push { x:x(i) - r(i), y:y(i) }
            i += 1
          return as

      right:
        dep: [p.left, p.top, p.radius]
        calc: ->
          length = calcLength(p)
          x = p.left.gen()
          y = p.top.gen()
          r = p.radius.gen()
          as = []
          i = 0
          while i < length 
            as.push { x:x(i) + r(i), y:y(i) }
            i += 1
          return as
          
      top:
        dep: [p.left, p.top, p.radius]
        calc: ->
          length = calcLength(p)
          x = p.left.gen()
          y = p.top.gen()
          r = p.radius.gen()
          as = []
          i = 0
          while i < length-1 
            as.push { x:x(i), y:y(i) - r(i) }
            i += 1
          return as
          
      bottom:
        dep: [p.left, p.top, p.radius]
        calc: ->
          length = calcLength(p)
          x = p.left.gen()
          y = p.top.gen()
          r = p.radius.gen()
          as = []
          i = 0
          while i < length-1 
            as.push { x:x(i), y:y(i) + r(i) }
            i += 1
          return as

    render = ->
      len = calcLength(p)

      m = selectEnterExit(g, o, p, len)
      update_attr[o.myClass](m, p, true)

      if panel.width.hasChanged() or panel.height.hasChanged()
        clip.attr('width', panel.width.get()).attr('height', panel.height.get()) if clip
        dur = 0
      else
        dur = o.duration.get()
      
      m = reselectUpdate(g, o, dur)
      update_attr[o.myClass](m, p)
      
      null

    listen = [panel.width, panel.height]
    listen.push p[k] for k in listen_attr[o.myClass]
    dvl.register({fn:render, listen:listen, name:'dots_renderer'})
    makeAnchors(anchors, o)  
)()


# HTML # --------------------------------------------------

dvl.html = {}

##-------------------------------------------------------
##
##  Output to an HTML attribute
##
dvl.html.out = ({selector, data, format, invalid, hideInvalid, attr, style, text}) ->
  throw 'must have data' unless data
  data = dvl.wrapConstIfNeeded(data)

  throw 'must have selector' unless selector
  selector = dvl.wrapConstIfNeeded(selector)
  
  format = dvl.wrapConstIfNeeded(format or dvl.identity)
  invalid = dvl.wrapConstIfNeeded(invalid or null)
  hideInvalid = dvl.wrapConstIfNeeded(hideInvalid or false)
  
  if attr
    what = dvl.wrapConstIfNeeded(attr)
    out = (selector, string) -> d3.select(selector).attr(what.get(), string)
  else if style
    what = dvl.wrapConstIfNeeded(style)
    out = (selector, string) -> d3.select(selector).style(what.get(), string)
  else if text
    out = (selector, string) -> d3.select(selector).text(string)
  else
    out = (selector, string) -> d3.select(selector).html(string)

  updateHtml = () ->
    s = selector.get()
    a = format.get()
    d = data.get()
    if s?
      if a? and d?
        sel = out(s, a(d))
        sel.style('display', null) if hideInvalid.get()
      else
        inv = invalid.get()
        out(s, inv) if inv?
        d3.select(s).style('display', 'none') if hideInvalid.get()
    null

  dvl.register({fn:updateHtml, listen:[data, selector, format], name:'html_out'})
  null
  
  
##-------------------------------------------------------
##
##  Select (dropdown box) made with HTML
##
dvl.html.select = ({selector, values, names, def, selection}) ->
  throw 'must have selector' unless selector
  options = dvl.wrapConstIfNeeded(options)
  selection = dvl.wrapVarIfNeeded(selection, 'selection')
  
  values = dvl.wrapConstIfNeeded(values)
  names = dvl.wrapConstIfNeeded(names)
  
  selChange = ->
    selection.set(selectEl.node().value).notify()
  
  selectEl = d3.select(selector)
    .append('select')
    .on('change', selChange)
    
  selectEl.selectAll('option')
      .data(d3.range(values.len()))
        .enter('option')
          .attr('value', values.gen())
          .text(names.gen())
  
  #updateSelection = () ->
  #  selectEl
  
  selChange()
  #dvl.register({fn: updateSelection, listen:[], change:[selection]})
  return selection

##-------------------------------------------------------
##
##  Table made with HTML
##
##  This module draws an HTML table that can be sorted
##
##  selector:    Where to append the table.
##  classStr:    The class to add to the table.
## ~rowClassGen: The generator for row classes
## ~visible:     Toggles the visibility of the table. [true]
##  columns:     A list of columns to drive the table.
##    column:
##      id:               The id by which the column will be identified.
##     ~title:            The title of the column header.
##     ~headerTooltip:    The popup tool tip (title element text) of the column header.
##      classStr:         The class given to the 'th' and 'td' elements in this column, if not specified will default to the id.
##      click:            The function to call when the column is clicked.
##     -gen:              The generator that drives the column data.
##     ~sortable:         Toggles wheather the column is sortable or not. [true]
##     -sortGen:          The generator generator that will drive the sorting, if not provided then gen will be used instead. [gen]
##     ~showIndicator:    Toggle the display of the sorting indicator for this column. [true]
##     ~reverseIndicator: Reverses the asc / desc directions of the indicator for this column. [false]
##
##  sort:
##   ~on:              The id of the column on which to sort.
##   ~order:           The order of the sort. Must be one of {'asc', 'desc', 'none'}.
##   ~modes:           The order rotation that is allowed. Must be an array of [{'asc', 'desc', 'none'}].
##   ~autoOnClick:     Toggle wheather the table will be sorted (updating sort.on and/or possibly sort.order) automaticaly when clicked. [true]
##   ~indicator:       
##     none:             The image url for the 'none' sorting mode.
##     desc:             The image url for the 'desc' sorting mode.
##     asc:              The image url for the 'asc' sorting mode.
##                     
## ~showHeader:        Toggle showing the header [true]
## ~onHeaderClick:     Callback when the header of a column is clicked.
## ~headerTooltip:     The default herder tooltip (title element text).
## ~rowLimit:          The maximum number of rows to show; if null all the rows are shown. [null]
##
dvl.html.table = ({selector, classStr, rowClassGen, visible, columns, showHeader, sort, onHeaderClick, headerTooltip, rowLimit}) ->
  throw 'selector has to be a plain string.' if dvl.knows(selector)
  throw 'columns has to be a plain array.' if dvl.knows(columns)
  throw 'sort has to be a plain object.' if dvl.knows(sort)
  
  visible = dvl.wrapConstIfNeeded(if visible? then visible else true)
  
  showHeader = dvl.wrapConstIfNeeded(if showHeader? then showHeader else true)
  onHeaderClick = dvl.wrapConstIfNeeded(onHeaderClick)
  headerTooltip = dvl.wrapConstIfNeeded(headerTooltip or null)
  
  rowLimit = dvl.wrapConstIfNeeded(rowLimit or null)
  
  sort = sort or {}
  
  sortOn = dvl.wrapVarIfNeeded(sort.on)
  sortOnClick = dvl.wrapConstIfNeeded(if sort.autoOnClick? then sort.autoOnClick else true)
  sortModes = dvl.wrapConstIfNeeded(sort.modes or ['asc', 'desc', 'none'])
  modes = sortModes.get()
  sortOrder = dvl.wrapVarIfNeeded(sort.order or (if modes.length > 0 then modes[0] else 'none'))
  
  listen = [rowClassGen, visible, showHeader, headerTooltip, sortOn, sortModes, sortOrder]
  
  sortIndicator = dvl.wrapConstIfNeeded(sort.indicator)
  listen.push sortIndicator
  
  # flatten possible merge header columns
  if columns.length and columns[0].columns
    topHeader = []
    newColumns = []
    for tc in columns
      continue unless tc.columns and tc.columns.length isnt 0
      topHeader.push { title: dvl.wrapConstIfNeeded(tc.title), classStr: tc.classStr, span: tc.columns.length }
      listen.push tc.title
      for c in tc.columns
        newColumns.push c
    columns = newColumns
  
  # process columns
  for i, c of columns
    c.title = dvl.wrapConstIfNeeded(c.title or '')
    c.sortable = dvl.wrapConstIfNeeded(if c.sortable? then c.sortable else true)
    c.showIndicator = dvl.wrapConstIfNeeded(if c.showIndicator? then c.showIndicator else true);
    c.reverseIndicator = dvl.wrapConstIfNeeded(c.reverseIndicator or false);
    c.headerTooltip = dvl.wrapConstIfNeeded(c.headerTooltip or null)
    listen.push c.title, c.showIndicator, c.reverseIndicator, c.gen, c.sortGen, c.headerTooltip
    c.uniquClass = 'column_' + i 
  
  t = d3.select(selector).append('table')
  t.attr('class', classStr) if classStr
  
  colClass = (c) -> (c.classStr or c.id) + ' ' + c.uniquClass + if c.sorted then ' sorted' else ''
  headerColClass = (c) -> colClass(c) + if c.sortable.get() then ' sortable' else ' unsortable'

  thead = t.append('thead')
  th = thead.append('tr').attr('class', 'top_header') if topHeader
  h = thead.append('tr')
  b = t.append('tbody')
  
  if topHeader
    th.selectAll('th')
      .data(topHeader)
      .enter('th')
        .attr('class', (d) -> d.classStr or null)
        .attr('colspan', (d) -> d.span)
          .append('div')
            .text((d) -> d.title.get());
  
  sel = h.selectAll('th')
    .data(columns)
    .enter('th')
      .on('click', (c) ->
        return unless c.id?
        
        if onHeaderClick.get()
          onHeaderClick.get()(c.id)
        
        if sortOnClick.get() and c.sortable.get()
          if sortOn.get() is c.id
            modes = sortModes.get()
            si = modes.indexOf(sortOrder.get())
            sortOrder.set(modes[(si+1) % modes.length]).notify()
          else
            sortOn.set(c.id).notify()
        )
  
  si = sortIndicator.get();
  sel.append('span') # title text container
  sel.append('img')
    .attr('class', 'sort_indicator')
    .style('display', (c) -> if c.showIndicator.get() and si and si.none and c.sortable.get() then null else 'none')
    .attr('src', (c) -> if c.showIndicator.get() and si and si.none then si.none else null)

  tableLength = ->
    length = +Infinity
    for c in columns
      l = c.gen.len()
      length = l if l < length
    length = 1 if length == Infinity

    length

  makeTable = ->  
    length = tableLength()
    r = pv.range(length)

    if visible.hasChanged()
      t.style('display', if visible.get() then null else 'none')

    if showHeader.hasChanged()
      thead.style('display', if showHeader.get() then null else 'none')

    if topHeader
      th.selectAll('th > div')
        .data(topHeader)
          .text((d) -> d.title.get());

    if headerTooltip.hasChanged()
      h.attr('title', headerTooltip.get());

    if sort
      sortOnId = sortOn.get()
      sortCol = null
      for c in columns
        if c.sorted = (c.id is sortOnId)
          sortCol = c
          throw "sort on column marked unsortable (#{sortOnId})" unless sortCol.sortable.get()
          
    
      if sortCol
        sortGen = (sortCol.sortGen or sortCol.gen).gen()
        numeric = sortGen and typeof(sortGen(0)) is 'number'

        dir = String(sortOrder.get()).toLowerCase()
        if dir is 'desc'
          sortFn = if numeric then ((i,j) -> sortGen(j) - sortGen(i)) else ((i,j) -> sortGen(j).toLowerCase().localeCompare(sortGen(i).toLowerCase())) 
          r.sort(sortFn)
        else if dir is 'asc' 
          sortFn = if numeric then ((i,j) -> sortGen(i) - sortGen(j)) else ((i,j) -> sortGen(i).toLowerCase().localeCompare(sortGen(j).toLowerCase()))
          r.sort(sortFn)
        # else do nothing
        
      if sortIndicator.get()
        h.selectAll('th').data(columns)
          .select('img')
            .style('display', (c) -> if c.sortable.get() and c.showIndicator.get() and sortIndicator.get()[if c is sortCol then dir else 'none'] then null else 'none')
            .attr('src', (c) ->
              if c.showIndicator.get()
                which = if c is sortCol and dir isnt 'none'
                  if c.reverseIndicator.get() then (if dir is 'asc' then 'desc' else 'asc') else dir
                else 
                  'none'
                sortIndicator.get()[which]
              else
                null
            )
    
    h.selectAll('th').data(columns)
      .attr('class', headerColClass)
      .attr('title', (c) -> c.headerTooltip.get())
        .select('span')
          .text((c) -> c.title.get())
    
    limit = rowLimit.get()
    r = r.splice(0, Math.max(0, limit)) if limit?

    sel = b.selectAll('tr').data(r)
    ent = sel.enter('tr')
    if rowClassGen
      gen = rowClassGen.gen()
      ent.attr('class', gen)
      sel.attr('class', gen)
    sel.exit().remove()

    sel = b.selectAll('tr')
    row = sel.selectAll('td').data(columns)
    row.enter('td').attr('class', colClass)
    row.attr('class', colClass)
    row.exit().remove()

    for col in columns
      gen = col.gen.gen();
      ren = if dvl.typeOf(col.renderer) is 'function' then col.renderer else dvl.html.table.renderer[col.renderer or 'html']
      ren(sel.select('td.' + col.uniquClass), gen, col.sorted)

    null
  
  dvl.register({fn:makeTable, listen:listen, name:'table_maker'})
  
  return {
    sortOn
    sortOrder
  }

dvl.html.table.renderer = 
  text: (col, dataFn) ->
    col.text(dataFn)
    null
  html: (col, dataFn) ->
    col.html(dataFn)
    null
  aLink: ({linkGen, titleGen}) -> (col, dataFn) ->
    sel = col.selectAll('a').data((d) -> [d])
    config = (d) ->
      d.attr('href', linkGen.gen()).text(dataFn)
      d.attr('title', titleGen.gen()) if titleGen 
    config(sel.enter('a'))
    config(sel)
    null
  spanLink: ({click, titleGen}) -> (col, dataFn) -> 
    sel = col.selectAll('span').data((d) -> [d])
    config = (d) ->
      d.html(dataFn)
      d.on('click', click)
      d.attr('title', titleGen.gen()) if titleGen
    config(sel.enter('span').attr('class', 'span_link'))
    config(sel)
    null
  barDiv: (col, dataFn) ->
    sel = col.selectAll('div').data((d) -> [d])
    sel.enter('div').attr('class', 'bar_div').style('width', ((d) -> dataFn(d) + 'px'))
    sel.style('width', ((d) -> dataFn(d) + 'px'))
    null
  svgSparkline: ({classStr, width, height, x, y, padding}) -> (col, dataFn) -> 
    svg = col.selectAll('svg').data((i) -> [dataFn(i)])
    
    line = (d) ->
      mmx = dvl.util.getMinMax(d, ((d) -> d[x]))
      mmy = dvl.util.getMinMax(d, ((d) -> d[y]))
      sx = d3.scale.linear().domain([mmx.min, mmx.max]).range([padding, width-padding])
      sy = d3.scale.linear().domain([mmy.min, mmy.max]).range([height-padding, padding])
      return d3.svg.line().x((dp) -> sx(dp[x])).y((dp) -> sy(dp[y]))(d)
    
    make_sparks = (svg) ->
      sel = svg.selectAll('path')
        .data((d) -> [d])
    
      sel.enter("svg:path")
        .attr("class", "line")
        .attr("d", line)
      
      sel.attr("d", line)
      
      points = svg.selectAll('circle')
        .data((d) -> 
          mmx = dvl.util.getMinMax(d, ((d) -> d[x]))
          mmy = dvl.util.getMinMax(d, ((d) -> d[y]))
          sx = d3.scale.linear().domain([mmx.min, mmx.max]).range([padding, width-padding])
          sy = d3.scale.linear().domain([mmy.min, mmy.max]).range([height-padding, padding])
          return [
            ['top',    sx(d[mmy.maxIdx][x]), sy(mmy.max)]
            ['bottom', sx(d[mmy.minIdx][x]), sy(mmy.min)]
            ['right',  sx(mmx.max), sy(d[mmx.maxIdx][y])]
            ['left',   sx(mmx.min), sy(d[mmx.minIdx][y])]
          ]
        )
      
      points.enter("svg:circle")
        .attr("r", 2)
        .attr("class", (d) -> d[0])
        .attr("cx", (d) -> d[1])
        .attr("cy", (d) -> d[2])
        
      points
        .attr("cx", (d) -> d[1])
        .attr("cy", (d) -> d[2])
    
    make_sparks(svg)
    make_sparks(svg.enter('svg:svg').attr('class', classStr).attr('width', width).attr('height', height))
    null
    
    
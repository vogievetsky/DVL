dvl = require './core'
utilModule = require './util'

##-------------------------------------------------------
##
##  Asynchronous request fetcher.
##
##  Runs asynchronous operations
##  This function adds the given query to the global async getter,
##  the getter then automatically groups requests that come from the same event cycle.
##
## ~query: the query to send to the asynchronous requester
##
outstanding = dvl(0).name('outstanding')
ajaxManagers = []
blockDummy = {}

makeManager = ->
  nextQueryId = 0
  initRequestBundle = []
  queries = []

  maybeDone = dvl.group (requestBundle) ->
    for request in requestBundle
      return if request.status isnt 'ready'

    for request in requestBundle
      request.res.value(request.resVal ? null)
      request.status = ''
      request.requestBundle = null
      delete request.resVal

    return

  getData = (request, query, err, resVal) ->
    throw new Error("getData called outside of a request") unless request.requestBundle
    if err
      request.resVal = null
      request.onError(err) if request.onError
    else
      request.resVal = if query then resVal else null

    request.status = 'ready'
    delete request.curAjax
    delete request.processResponce

    maybeDone(request.requestBundle)
    return

  makeRequest = (request) ->
    throw new Error("invalid request") unless request in request.requestBundle
    requestCount = request.requestCount
    _query = request.query.value()

    oldAjax = request.curAjax
    oldProcessResponce = request.processResponce

    if _query?
      if request.invalidOnLoad.value()
        request.res.value(null)

      responceProcessed = false
      processResponce = (err, data) ->
        responceProcessed = true if this is blockDummy
        return if responceProcessed
        responceProcessed = true

        requestCount.value(requestCount.value() - 1)

        getData(request, _query, err, data)
        return

      requestCount.value(requestCount.value() + 1)
      request.processResponce = processResponce
      request.curAjax = request.requester(_query, processResponce)
    else
      getData(request, _query, null, null)

    # Abort the old call after making the new
    if oldProcessResponce
      requestCount.value(requestCount.value() - 1)
      oldProcessResponce.call(blockDummy)
      oldAjax?.abort?()

    return

  inputChange = ->
    makeRequestLater = []
    newRequestBundle = []
    for q in queries
      continue unless q.query.hasChanged()

      if q.status is 'virgin'
        if q.query.value()
          initRequestBundle.push(q)
          q.status = 'requesting'
          q.requestBundle = initRequestBundle
          makeRequestLater.push(q)
        else
          q.status = ''
      else
        q.status = 'requesting'
        if q.requestBundle
          # Query changed mid request which may have already completed, sadly we need to scrap it.
          delete q.resVal
          makeRequestLater.push(q)
        else
          newRequestBundle.push(q)
          q.requestBundle = newRequestBundle
          makeRequestLater.push(q)

    makeRequest(q) for q in makeRequestLater
    return

  worker = null
  addHoock = (query, ret, requestCount) ->
    if worker
      worker.addChange(ret, requestCount)
      worker.addListen(query) #! After add change
    else
      worker = dvl.register {
        listen: [query]
        change: [ret, requestCount]
        fn: inputChange
      }

    return

  return (query, invalidOnLoad, onError, requester, requestCount) ->
    nextQueryId++
    res = dvl()
    q = {
      id: nextQueryId
      query
      res
      status: 'virgin'
      requester
      onError
      invalidOnLoad
      requestBundle: null
      curAjax: null
      requestCount
    }
    queries.push(q)
    addHoock(query, res, requestCount)
    return res


async = ({query, invalidOnLoad, onError, groupId, requester, requestCount}) ->
  throw new Error('it does not make sense to not have a query') unless query
  throw new Error('it does not make sense to not have a requester') unless requester
  throw new Error('requester must be a function') unless typeof requester is 'function'
  query = dvl.wrap(query)
  invalidOnLoad = dvl.wrap(invalidOnLoad or false)
  requestCount or= outstanding
  requestCount = dvl.wrapVar(requestCount)

  groupId = async.getGroupId() unless groupId?
  ajaxManagers[groupId] or= makeManager()

  return ajaxManagers[groupId](query, invalidOnLoad, onError, requester, requestCount)

async.outstanding = outstanding

nextGroupId = 0
async.getGroupId = ->
  id = nextGroupId
  nextGroupId++
  return id

async.requester = {
  ajax: (query, complete) ->
    data = if query.dataFn then query.dataFn(query.data) else query.data
    ajax = jQuery.ajax {
      url: query.url
      data: data
      type: query.method or 'GET'
      dataType: query.dataType or 'json'
      contentType: (query.contentType or 'application/json') if data?
      processData: query.processData or false
      success: (resVal) ->
        resVal = query.fn(resVal, query) if query.fn
        ajax = null
        complete(null, resVal)
        return
      error: (xhr, textStatus) ->
        ajax = null
        complete(xhr.responseText or textStatus, null)
        return
    }

    abort = ->
      if ajax
        ajax.abort()
        ajax = null

      return

    return { abort }


  cacheWrap: ({requester, max, timeout, keyFn} = {}) ->
    throw new Error('it does not make sense to not have a requester') unless requester
    throw new Error('requester must be a function') unless typeof requester is 'function'

    max = dvl.wrap(max or 100)
    timeout = dvl.wrap(timeout or 30*60*1000)
    cache = {}
    count = 0
    keyFn or= ({url, data, method, dataType, contentType, processData}) ->
      return [url, utilModule.strObj(data), method, dataType, contentType, processData].join('@@')

    trim = ->
      tout = timeout.value()
      if tout > 0
        cutoff = Date.now() - tout
        newCache = {}
        for q,d of cache
          newCache[q] = d if cutoff < d.time
        cache = newCache

      m = max.value()
      while m < count
        oldestQuery = null
        oldestTime = Infinity
        for q,d of cache
          if d.time < oldestTime
            oldestTime = d.time
            oldestQuery = q
        delete cache[oldestQuery]
        count--

    dvl.register {
      listen: [max, timeout]
      fn: trim
    }

    return {
      clear: ->
        cache = {}
        count = 0
        return

      requester: (query, complete) ->
        key = keyFn(query)

        c = cache[key]
        added = false
        if not c
          # first time we see this query, create stub
          cache[key] = c = {
            time: Date.now()
            waiting: [complete]
          }
          added = true
          count++
          trim()

          c.ajax = requester(query, (err, resVal) ->
            if err
              return if err is "abort"
              c.ajax = null
              delete cache[key]
              count--
              cb(err, null) for cb in c.waiting
              delete c.waiting
              return

            c.ajax = null
            c.resVal = resVal
            cb(null, resVal) for cb in c.waiting
            delete c.waiting
            return
          )

        if c.resVal
          complete(null, c.resVal)

          abort = ->
            # There is nothing to do
            return
        else
          c.waiting.push(complete) unless added

          abort = ->
            return unless c.waiting
            c.waiting = c.waiting.filter((l) -> l isnt complete)
            complete('abort', null)

            if c.waiting.length is 0 and c.ajax
              c.ajax.abort()
              c.ajax = null
              delete cache[key]
              count--

            return

        return { abort }
    }
}

module.exports = async

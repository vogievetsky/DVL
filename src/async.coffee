##-------------------------------------------------------
##
##  Asynchronous ajax fetcher.
##
##  Fetches ajax data form the server at the given url.
##  This function addes the given url to the global json getter,
##  the getter then automaticly groups requests that come from the same event cycle.
##
## ~url:  the url to fetch.
## ~data: data to send
##  type: the type of the request. [json]
##  map:  a map to apply to the recived array.
##  fn:   a function to apply to the recived input.
##
do ->
  outstanding = dvl(0).name('json_outstanding')
  ajaxManagers = []

  makeManager = ->
    nextQueryId = 0
    initRequestBundle = []
    queries = []

    maybeDone = dvl.group (request) ->
      for q in request
        return if q.status isnt 'ready'

      notify = []
      for q in request
        q.res.value(q.resVal ? null)
        q.status = ''
        q.requestBundle = null
        delete q.resVal

      return

    getData = (err, resVal) ->
      q = @q
      if err
        q.resVal = null
        q.onError(err) if q.onError
      else
        q.resVal = if @query then resVal else null

      q.status = 'ready'
      q.curAjax = null

      maybeDone(q.requestBundle)
      return

    makeRequest = (q) ->
      _query = q.query.value()
      ctx = {
        q
        query: _query
      }
      if _query?
        if q.invalidOnLoad.value()
          q.res.value(null)

        outstanding.value(outstanding.value() + 1)
        oldAjax = q.curAjax
        q.curAjax = q.requester(
          _query
          (err, data) ->
            outstanding.value(outstanding.value() - 1)
            return if err is 'abort'
            getData.call(ctx, err, data)
            return
        )
        # Abort the old call after making the new
        oldAjax?.abort?()

      else
        getData.call(ctx, null, null)

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
        else if q.requestBundle
          # Request may have already completed, sadly we need to scrap it.
          delete q.resVal
          q.status = 'requesting'
          makeRequestLater.push(q)
        else
          newRequestBundle.push(q)
          q.status = 'requesting'
          q.requestBundle = newRequestBundle
          makeRequestLater.push(q)

      makeRequest(q) for q in makeRequestLater
      return

    worker = null
    addHoock = (query, ret) ->
      if worker
        worker.addListen(query)
        worker.addChange(ret)
      else
        worker = dvl.register {
          name:   'ajax_manager'
          listen: [query]
          change: [ret, outstanding]
          fn:     inputChange
        }

      return

    return (query, invalidOnLoad, onError, requester, name) ->
      nextQueryId++
      res = dvl().name(name)
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
      }
      queries.push(q)
      addHoock(query, res)
      return res


  dvl.async = ({query, invalidOnLoad, onError, groupId, requester, name}) ->
    throw 'it does not make sense to not have a query' unless query
    throw 'it does not make sense to not have a requester' unless requester
    throw 'requester must be a function' unless typeof requester is 'function'
    query = dvl.wrap(query)
    invalidOnLoad = dvl.wrap(invalidOnLoad or false)
    name or= 'ajax_data'

    groupId = dvl.async.getGroupId() unless groupId?
    ajaxManagers[groupId] or= makeManager()

    return ajaxManagers[groupId](query, invalidOnLoad, onError, requester, name)

  dvl.async.outstanding = outstanding

  nextGroupId = 0
  dvl.async.getGroupId = ->
    id = nextGroupId
    nextGroupId++
    return id

  return


dvl.async.requester = {
  ajax: (query, complete) ->
    ajax = jQuery.ajax {
      url: query.url
      data: if query.dataFn then query.dataFn(query.data) else query.data
      type: query.method or 'GET'
      dataType: query.dataType or 'json'
      contentType: query.contentType or 'application/json'
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
    throw 'it does not make sense to not have a requester' unless requester
    throw 'requester must be a function' unless typeof requester is 'function'

    max = dvl.wrap(max or 100)
    timeout = dvl.wrap(timeout or 30*60*1000)
    cache = {}
    count = 0
    keyFn or= ({url, data, method, dataType, contentType, processData}) ->
      return [url, dvl.util.strObj(data), method, dataType, contentType, processData].join('@@')

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

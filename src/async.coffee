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
  normalRequester = null

  makeManager = ->
    nextQueryId = 0
    initQueue = []
    queries = {}

    maybeDone = (request) ->
      for q in request
        return if q.status isnt 'ready'

      notify = []
      for q in request
        if q.hasOwnProperty('resVal')
          q.res.set(q.resVal ? null)
          notify.push(q.res)
          q.status = ''
          delete q.resVal

      dvl.notify.apply(null, notify)
      return

    getData = (err, resVal) ->
      q = this.q
      if @url is q.url.value() and (@method is 'GET' or (@data is q.data.value() and @dataFn is q.dataFn.value()))
        if err
          q.resVal = null
          q.onError(err) if q.onError
        else
          q.resVal = if @url then resVal else null

      q.status = 'ready'
      q.curAjax = null

      maybeDone(this.request)
      return

    makeRequest = (q, request) ->
      _url = q.url.value()
      _data = q.data.value()
      _dataFn = q.dataFn.value()
      _method = q.method.value()
      _dataType = q.type.value()
      ctx = {
        q
        request
        url:    _url
        data:   _data
        dataFn: _dataFn
        method: _method
      }
      q.curAjax.abort() if q.curAjax
      if _url? and (_method is 'GET' or (_data? and _dataFn?)) and _dataType
        if q.invalidOnLoad.value()
          q.res.update(null)

        q.curAjax = q.requester.request {
          url: _url
          data: _data
          dataFn: _dataFn
          method: _method
          dataType: _dataType
          contentType: q.contentType.value()
          processData: q.processData.value()
          fn: q.fn
          outstanding
          complete: (err, data) -> getData.call(ctx, err, data)
        }

      else
        getData.call(ctx, null, null)

      return

    inputChange = ->
      bundle = []
      for id, q of queries
        continue unless q.url.hasChanged() or q.data.hasChanged() or q.dataFn.hasChanged()

        if q.status is 'virgin'
          if q.url.value()
            initQueue.push q
            q.status = 'requesting'
            makeRequest(q, initQueue)
          else
            q.status = ''
        else
          bundle.push(q)

      if bundle.length > 0
        q.status = 'requesting' for q in bundle
        makeRequest(q, bundle)  for q in bundle

      return

    worker = null
    addHoock = (url, data, dataFn, ret) ->
      if worker
        worker.addListen(url, data, dataFn)
        worker.addChange(ret)
      else
        worker = dvl.register {
          name:   'ajax_manager'
          listen: [url, data]
          change: [ret, outstanding]
          fn:     inputChange
        }

      return


    return (url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, requester, name) ->
      nextQueryId++
      res = dvl().name(name)
      q = {
        id: nextQueryId
        url
        data
        dataFn
        method
        contentType
        processData
        res
        status: 'virgin'
        type
        requester
        onError
        invalidOnLoad
      }
      q.fn = fn if fn
      queries[q.id] = q
      addHoock(url, data, dataFn, res)
      return res


  dvl.ajax = ({url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, groupId, requester, name}) ->
    throw 'it does not make sense to not have a url' unless url
    throw 'the fn function must be non DVL variable' if fn and dvl.knows(fn)
    url  = dvl.wrap(url)
    data = dvl.wrap(data)
    dataFn = dvl.wrap(dataFn or dvl.indentity)
    method = dvl.wrap(method or 'GET')
    type = dvl.wrap(type or 'json')
    contentType = dvl.wrap(contentType or 'application/x-www-form-urlencoded')
    processData = dvl.wrap(processData ? true)
    invalidOnLoad = dvl.wrap(invalidOnLoad or false)
    name or= 'ajax_data'

    groupId = dvl.ajax.getGroupId() unless groupId?
    ajaxManagers[groupId] or= makeManager()

    if not requester
      normalRequester or= dvl.ajax.requester.normal()
      requester = normalRequester

    return ajaxManagers[groupId](url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, requester, name)

  dvl.json = dvl.ajax
  dvl.ajax.outstanding = outstanding

  nextGroupId = 0
  dvl.ajax.getGroupId = ->
    id = nextGroupId
    nextGroupId++
    return id

  return


dvl.ajax.requester = {
  normal: () ->
    return {
      request: ({url, data, dataFn, method, dataType, contentType, processData, fn, outstanding, complete}) ->
        dataVal = if method isnt 'GET' then dataFn(data) else null

        getData = (resVal) ->
          if fn
            ctx = { url, data }
            resVal = fn.call(ctx, resVal)

          ajax = null
          complete(null, resVal)
          return

        getError = (xhr, textStatus) ->
          return if textStatus is "abort"
          ajax = null
          complete(xhr.responseText or textStatus, null)
          return

        ajax = jQuery.ajax {
          url
          data:        dataVal
          type:        method
          dataType
          contentType
          processData
          success:     getData
          error:       getError
          complete:    -> outstanding.value(outstanding.value() - 1)
          context:     { url }
        }

        outstanding.value(outstanding.value() + 1)

        return {
          abort: ->
            if ajax
              ajax.abort()
              ajax = null

            return
        }
    }


  cache: ({max, timeout, keyFn} = {}) ->
    max = dvl.wrap(max or 100)
    timeout = dvl.wrap(timeout or 30*60*1000)
    cache = {}
    count = 0
    keyFn or= (url, data, method, dataType, contentType, processData) ->
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

    dvl.register {fn:trim, listen:[max, timeout], name:'cache_trim'}


    return {
      request: ({url, data, dataFn, method, dataType, contentType, processData, fn, outstanding, complete}) ->
        dataVal = if method isnt 'GET' then dataFn(data) else null
        key = keyFn(url, data, method, dataType, contentType, processData)

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

          # make the request
          getData = (resVal) ->
            if fn
              ctx = { url, data }
              resVal = fn.call(ctx, resVal)

            c.ajax = null
            c.resVal = resVal
            cb(null, resVal) for cb in c.waiting
            delete c.waiting
            return

          getError = (xhr, textStatus) ->
            return if textStatus is "abort"
            c.ajax = null
            delete cache[key]
            count--
            cb(xhr.responseText or textStatus, null) for cb in c.waiting
            delete c.waiting
            return

          c.ajax = jQuery.ajax {
            url
            data:        dataVal
            type:        method
            dataType
            contentType
            processData
            success:     getData
            error:       getError
            complete:    -> outstanding.value(outstanding.value() - 1)
          }

          outstanding.value(outstanding.value() + 1)

        if c.resVal
          complete(null, c.resVal)

          return {
            abort: ->
              return
          }
        else
          c.waiting.push(complete) unless added

          return {
            abort: ->
              return unless c.waiting
              c.waiting = c.waiting.filter((l) -> l isnt complete)

              if c.waiting.length is 0 and c.ajax
                c.ajax.abort()
                c.ajax = null
                delete cache[key]
                count--

              return
          }

      clear: ->
        cache = {}
        count = 0
        return
    }
}

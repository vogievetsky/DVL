chai = require("chai")
expect = chai.expect
dvl = require("../../src")

verbose = false

wait = (time, fn) ->
  timer = setTimeout(fn, time)
  return {
    abort: -> clearTimeout(timer)
  }

describe 'async single', ->
  timeoutRequester = (query, complete) ->
    console.log "CALLED WITH #{query.value}" if verbose
    if query.value and typeof query.time is 'number'
      { abort: waitAbort } = wait query.time, ->
        console.log "REPLY WITH #{query.value}" if verbose
        complete(null, query.value)
        return
    else
      complete("bad query")

  requestCount = dvl(0)
  query = dvl()
  result = dvl.async {
    requestCount
    requester: timeoutRequester
    query: query
    invalidOnLoad: true
  }

  it 'should start with query being null', ->
    expect(query.value()).to.equal(null)

  it 'should work with a basic request', (done) ->
    query.value({ value: 'alpha', time: 10 })
    wait 20, ->
      expect(result.value()).to.equal('alpha')
      expect(requestCount.value()).to.equal(0, "query count")
      done()

  it 'should invalidate correctly', (done) ->
    query.value({ value: 'beta', time: 10 })

    wait 1, ->
      expect(result.value()).to.equal(null)

    wait 20, ->
      expect(result.value()).to.equal('beta')
      expect(requestCount.value()).to.equal(0, "query count")
      done()

  it 'should thrash correctly', (done) ->
    query.value({ value: 'v1', time: 10 })
    query.value({ value: 'v2', time: 10 })

    wait 5, ->
      query.value({ value: 'v3', time: 10 })

    wait 20, ->
      expect(result.value()).to.equal('v3')
      expect(requestCount.value()).to.equal(0, "query count")
      done()

  it 'should cancel correctly via null', (done) ->
    query.value({ value: 'v1', time: 20 })

    wait 5, ->
      query.value(null)
      expect(result.value()).to.equal(null)

    wait 30, ->
      expect(result.value()).to.equal(null)
      expect(requestCount.value()).to.equal(0, "query count")
      done()

  it 'should thrash correctly via null', (done) ->
    query.value({ value: 'v1', time: 20 })

    wait 5, ->
      query.value(null)

    wait 10, ->
      query.value({ value: 'v2', time: 20 })

    wait 50, ->
      expect(result.value()).to.equal('v2')
      expect(requestCount.value()).to.equal(0, "query count")
      done()


describe 'async group', ->
  timeoutRequester = (query, complete) ->
    console.log "CALLED WITH #{query.value}" if verbose
    if query.value and typeof query.time is 'number'
      { abort: waitAbort } = wait query.time, ->
        console.log "REPLY WITH #{query.value}" if verbose
        complete(null, query.value)
        return
    else
      complete("bad query")

  it 'should correctly query initially when one member is valid', (done) ->
    groupId = dvl.async.getGroupId()
    requestCount = dvl(0)

    query1 = dvl()
    result1 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query1
      invalidOnLoad: true
    }

    query2 = dvl({ value: "init2", time: 10 })
    result2 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query2
      invalidOnLoad: true
    }

    expect(result1.value()).to.equal(null, "result1 before")
    expect(result2.value()).to.equal(null, "result2 before")

    wait 20, ->
      expect(result1.value()).to.equal(null, "result1 wait")
      expect(result2.value()).to.equal("init2", "result2 wait")
      expect(requestCount.value()).to.equal(0, "query count")
      done()


  it 'should correctly query initially when all members are valid', (done) ->
    groupId = dvl.async.getGroupId()
    requestCount = dvl(0)

    query1 = dvl({ value: "init1", time: 10 })
    result1 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query1
      invalidOnLoad: true
    }

    query2 = dvl({ value: "init2", time: 20 })
    result2 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query2
      invalidOnLoad: true
    }

    # pretest
    expect(result1.value()).to.equal(null, "result1 before")
    expect(result2.value()).to.equal(null, "result2 before")

    wait 15, ->
      expect(result1.value()).to.equal(null, "result1 wait 15")
      expect(result2.value()).to.equal(null, "result2 wait 15")

    wait 25, ->
      expect(result1.value()).to.equal("init1", "result1 wait 25")
      expect(result2.value()).to.equal("init2", "result2 wait 25")
      expect(requestCount.value()).to.equal(0, "query count")
      done()


  it 'should correctly thrash initially when all members are valid', (done) ->
    groupId = dvl.async.getGroupId()
    requestCount = dvl(0)

    query1 = dvl({ value: "init1", time: 20 })
    result1 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query1
      invalidOnLoad: true
    }

    query2 = dvl({ value: "init2", time: 20 })
    result2 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query2
      invalidOnLoad: true
    }

    # pretest
    expect(result1.value()).to.equal(null, "result1 before")
    expect(result2.value()).to.equal(null, "result2 before")

    wait 5, ->
      query2.value({ value: "init2b", time: 40 })
      expect(result1.value()).to.equal(null, "result1 wait 5")
      expect(result2.value()).to.equal(null, "result2 wait 5")

    wait 25, ->
      expect(result1.value()).to.equal(null, "result1 wait 15")
      expect(result2.value()).to.equal(null, "result2 wait 15")

    wait 60, ->
      expect(result1.value()).to.equal("init1", "result1 wait 25")
      expect(result2.value()).to.equal("init2b", "result2 wait 25")
      expect(requestCount.value()).to.equal(0, "query count")
      done()

  it 'should not group independent updates', (done) ->
    groupId = dvl.async.getGroupId()
    requestCount = dvl(0)

    query1 = dvl()
    result1 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query1
      invalidOnLoad: true
    }

    query2 = dvl()
    result2 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query2
      invalidOnLoad: true
    }

    query1.value({ value: 't1', time: 10 })
    query2.value({ value: 't2', time: 20 })

    wait 5, ->
      expect(result1.value()).to.equal(null, "result1 wait 5")
      expect(result2.value()).to.equal(null, "result2 wait 5")

    wait 15, ->
      expect(result1.value()).to.equal('t1', "result1 wait 15")
      expect(result2.value()).to.equal(null, "result2 wait 15")

    wait 25, ->
      expect(result1.value()).to.equal("t1", "result1 wait 25")
      expect(result2.value()).to.equal("t2", "result2 wait 25")
      expect(requestCount.value()).to.equal(0, "query count")
      done()



  it 'should group dependent updates', (done) ->
    groupId = dvl.async.getGroupId()
    requestCount = dvl(0)

    query1 = dvl()
    result1 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query1
      invalidOnLoad: true
    }

    query2 = dvl()
    result2 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query2
      invalidOnLoad: true
    }

    dvl.group(->
      query1.value({ value: 't1', time: 10 })
      query2.value({ value: 't2', time: 20 })
    )()

    wait 5, ->
      expect(result1.value()).to.equal(null, "result1 wait 5")
      expect(result2.value()).to.equal(null, "result2 wait 5")

    wait 15, ->
      expect(result1.value()).to.equal(null, "result1 wait 15")
      expect(result2.value()).to.equal(null, "result2 wait 15")

    wait 25, ->
      expect(result1.value()).to.equal("t1", "result1 wait 25")
      expect(result2.value()).to.equal("t2", "result2 wait 25")
      expect(requestCount.value()).to.equal(0, "query count")
      done()



  it 'should thrash correctly on dependent updates', (done) ->
    groupId = dvl.async.getGroupId()
    requestCount = dvl(0)

    query1 = dvl()
    result1 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query1
      invalidOnLoad: true
    }

    query2 = dvl()
    result2 = dvl.async {
      groupId
      requestCount
      requester: timeoutRequester
      query: query2
      invalidOnLoad: true
    }

    dvl.group(->
      query1.value({ value: 't1', time: 10 })
      query2.value({ value: 't2', time: 20 })
    )()

    expect(requestCount.value()).to.equal(2, "initial query count")

    wait 5, ->
      expect(result1.value()).to.equal(null, "result1 wait 5")
      expect(result2.value()).to.equal(null, "result2 wait 5")
      expect(requestCount.value()).to.equal(2, "query count")
      query1.value({ value: 't1a', time: 30 })
      expect(requestCount.value()).to.equal(2, "query count")

    wait 15, ->
      expect(result1.value()).to.equal(null, "result1 wait 15")
      expect(result2.value()).to.equal(null, "result2 wait 15")
      expect(requestCount.value()).to.equal(2, "query count")

    wait 25, ->
      expect(result1.value()).to.equal(null, "result1 wait 25")
      expect(result2.value()).to.equal(null, "result2 wait 25")
      expect(requestCount.value()).to.equal(1, "query count")

    wait 40, ->
      expect(result1.value()).to.equal('t1a', "result1 wait 40")
      expect(result2.value()).to.equal('t2', "result2 wait 40")
      expect(requestCount.value()).to.equal(0, "query count")
      done()


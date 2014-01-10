dvl = require './core'
dvl.data = require './data'
dvl.async = require './async'
{ bind, bindSingle } = require('./bind')
dvl.bind = bind
dvl.bindSingle = bindSingle
dvl.html = require './html'
dvl.svg = require './svg'
dvl.snap = require './snap'
dvl.util = require './util'

module.exports = dvl

dvl = require './core'
dvl.d3 = require 'd3'
dvl.async = require './async'
{ bind, bindSingle } = require('./bind')
dvl.bind = bind
dvl.bindSingle = bindSingle
dvl.html = require './html'
dvl.svg = require './svg'
dvl.snap = require './snap'
dvl.misc = require './misc'
dvl.util = require './util'

module.exports = dvl

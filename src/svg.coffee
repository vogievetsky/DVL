# SVG

clipId = 0
dvl.svg or= {}

###*
##
##@example
##var svg = dvl.bind({
##  parent: d3.select('body'),
##  self: 'svg',
##  attr: {
##    width: width,
##    height: height
##  }
##});

##var clipPathId = dvl.svg.clipPath({
##  parent: svg,
##  width:  innerWidth,
##  height: innerHeight
##});

##var vis = dvl.bind({
##  parent: svg,
##  self: 'g.vis',
##  attr: {
##    'clip-path': clipPathId
##  }
##});
###
dvl.svg.clipPath = ({parent, x, y, width, height}) ->
  x = dvl.wrap(x or 0)
  y = dvl.wrap(y or 0)

  clipId++
  myId = "cp#{clipId}"
  cp = dvl.valueOf(parent)
    .append('defs')
      .append('clipPath')
      .attr('id', myId)

  dvl.bind {
    parent: cp
    self: 'rect'
    attr: {
      x
      y
      width
      height
    }
  }

  return "url(##{myId})"
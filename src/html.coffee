# HTML # --------------------------------------------------

dvl.html = {}

##-------------------------------------------------------
##  Capture the size of something in HTML
##
dvl.html.resizer = ({selector, out, dimension, fn}) ->
  out = dvl.wrapVar(out)
  dimension = dvl.wrap(dimension or 'width')
  fn = dvl.wrap(fn or dvl.identity)

  onResize = ->
    _dimension = dimension.value()
    _fn = fn.value()
    if _dimension in ['width', 'height'] and _fn
      if selector
        e = jQuery(selector)
        val = e[_dimension]()
      else
        val = document.body[if _dimension is 'width' then 'clientWidth' else 'clientHeight']

      out.value(_fn(val))
    else
      out.value(null)

  $(window).resize onResize
  dvl.register {
    name: 'resizer'
    listen: [dimension, fn]
    change: [out]
    fn: onResize
  }
  return out

##-------------------------------------------------------
##  Output to an HTML attribute
##
dvl.html.out = ({selector, data, fn, format, invalid, hideInvalid, attr, style, text}) ->
  throw 'must have data' unless data
  data = dvl.wrap(data)
  format = format ? fn

  throw 'must have selector' unless selector
  selector = dvl.wrap(selector)

  format = dvl.wrap(format or dvl.identity)
  invalid = dvl.wrap(invalid or null)
  hideInvalid = dvl.wrap(hideInvalid or false)

  if attr
    what = dvl.wrap(attr)
    out = (selector, string) -> d3.select(selector).attr(what.value(), string)
  else if style
    what = dvl.wrap(style)
    out = (selector, string) -> d3.select(selector).style(what.value(), string)
  else if text
    out = (selector, string) -> d3.select(selector).text(string)
  else
    out = (selector, string) -> d3.select(selector).html(string)

  updateHtml = () ->
    s = selector.value()
    a = format.value()
    d = data.value()
    if s?
      if a? and d?
        sel = out(s, a(d))
        sel.style('display', null) if hideInvalid.value()
      else
        inv = invalid.value()
        out(s, inv)
        d3.select(s).style('display', 'none') if hideInvalid.value()
    return

  dvl.register({fn:updateHtml, listen:[data, selector, format], name:'html_out'})
  return


##-------------------------------------------------------
##
##  Create HTML list
##
dvl.html.list = ({selector, data, label, link, class:listClass, selection, selections, onSelect, onEnter, onLeave, icons, extras, classStr, sortFn}) ->
  throw 'must have selector' unless selector
  throw 'must have data' unless data
  selection  = dvl.wrapVar(selection, 'selection')
  selections = dvl.wrapVar(selections or [], 'selections')
  sortFn = dvl.wrap(sortFn)

  data = dvl.wrap(data)
  label = dvl.wrap(label or dvl.identity)
  link = dvl.wrap(link)

  icons or= []
  for i in icons
    i.position or= 'right'

  if listClass?
    listClass = dvl.wrap(listClass)
  else
    listClass = dvl.apply(
      [selection, selections]
      allowNull: true
      (_selection, _selections) ->
        if _selection
          if _selections
            return (value) ->
              (if value is _selection  then 'is_selection'  else 'isnt_selection') + ' ' +
              (if value in _selections then 'is_selections' else 'isnt_selections')
          else
            return (value) ->
              (if value is _selection  then 'is_selection'  else 'isnt_selection')
        else
          if _selections
            return (value) ->
              (if value in _selections then 'is_selections' else 'isnt_selections')
          else
            return null
    )

  ul = d3.select(selector).append('ul').attr('class', classStr)

  onClick = (val, i) ->
    return if onSelect?(val, i) is false
    linkVal = link.value()?(val)
    selection.set(val)

    sl = (selections.value() or []).slice()
    i = sl.indexOf(val)
    if i is -1
      sl.push(val)
      _sortFn = sortFn.value()
      if typeof _sortFn is 'function'
        sl.sort(_sortFn)
      else
        sl.sort()
    else
      sl.splice(i,1)
    selections.set(sl)

    dvl.notify(selection, selections)
    window.location.href = linkVal if linkVal
    return

  dvl.register {
    name: 'update_html_list'
    listen: [data, label, link]
    fn: ->
      _data  = data.value()
      _label = label.value()
      _link  = link.value()
      _class = listClass.value()

      return unless _data
      _data = _data.valueOf()

      addIcons = (el, position) ->
        icons.forEach (icon) ->
          return unless icon.position is position

          classStr = 'icon_cont ' + position
          classStr += ' ' + icon.classStr if icon.classStr

          el.append('div')
            .attr('class', classStr)
            .attr('title', icon.title)
            .on('click', (val, i) ->
              d3.event.stopPropagation() if icon.onSelect?(val, i) is false
              return
            ).on('mouseover', (val, i) ->
              d3.event.stopPropagation() if icon.onEnter?(val, i) is false
              return
            ).on('mouseout', (val, i) ->
              d3.event.stopPropagation() if icon.onLeave?(val, i) is false
              return
            ).append('div')
              .attr('class', 'icon')

          return
        return

      sel = ul.selectAll('li').data(_data)
      a = sel.enter().append('li').append('a')

      addIcons a, 'left'
      a.append('span')
      addIcons a, 'right'

      cont = sel
        .attr('class', _class)
        .on('click', onClick)
        .on('mouseover', onEnter)
        .on('mouseout', onLeave)
        .select('a')
          .attr('href', _link)


      cont.select('span').text(_label)

      sel.exit().remove()
      return
  }

  dvl.register {
    name: 'update_class_list'
    listen: [listClass]
    fn: ->
      _class = listClass.value()
      ul.selectAll('li').attr('class', _class)
  }

  return {
    selection
    selections
    node: ul.node()
  }


dvl.html.dropdownList = ({selector, data, label, selectionLabel, link, class:listClass, selection, selections, onSelect, onEnter, onLeave, classStr, menuAnchor, menuOffset, title, icons, sortFn, keepOnClick}) ->
  throw 'must have selector' unless selector
  throw 'must have data' unless data
  selection = dvl.wrapVar(selection, 'selection')
  selections = dvl.wrapVar(selections, 'selections')
  menuAnchor = dvl.wrap(menuAnchor or 'left')
  menuOffset = dvl.wrap(menuOffset or { x:0, y:0 })

  data = dvl.wrap(data)
  label = dvl.wrap(label or dvl.identity)
  selectionLabel = dvl.wrap(selectionLabel or label)
  link = dvl.wrap(link)

  title = dvl.wrap(title) if title
  icons or= []

  menuOpen = false
  getClass = ->
    (classStr ? '') + ' ' + (if menuOpen then 'open' else 'closed')

  divCont = d3.select(selector)
    .append('div')
    .attr('class', getClass())
    .style('position', 'relative')

  selectedDiv = divCont.append('div')
    .attr('class', 'selected')

  valueSpan = selectedDiv.append('span')

  open = ->
    sp = $(selectedDiv.node())
    pos = sp.position()
    height = sp.outerHeight(true)
    anchor = menuAnchor.value()
    offset = menuOffset.value()
    menuCont
      .style('display', null)
      .style('top', (pos.top + height + offset.y) + 'px')

    if anchor is 'left'
      menuCont.style('left', (pos.left + offset.x) + 'px')
    else
      menuCont.style('right', (pos.left - offset.x) + 'px')

    menuOpen = true
    divCont.attr('class', getClass())
    return

  close = ->
    menuCont.style('display', 'none')
    menuOpen = false
    divCont.attr('class', getClass())
    return

  myOnSelect = (text, i) ->
    close() unless keepOnClick
    return onSelect?(text, i)

  icons.forEach (icon) ->
    icon_onSelect = icon.onSelect
    icon.onSelect = (val, i) ->
      close() unless keepOnClick
      return icon_onSelect?(val, i)
    return

  menuCont = divCont.append('div')
    .attr('class', 'menu_cont')
    .style('position', 'absolute')
    .style('z-index', 1000)
    .style('display', 'none')

  dvl.html.list {
    selector: menuCont.node()
    data
    label
    link
    class: listClass
    sortFn
    selection
    selections
    onSelect: myOnSelect
    onEnter
    onLeave
    classStr: 'list'
    icons
  }

  $(window).bind('click', (e) ->
    return if $(menuCont.node()).find(e.target).length

    if selectedDiv.node() is e.target or $(selectedDiv.node()).find(e.target).length
      if menuOpen
        close()
      else
        open()
    else
      close()

    return {
      node: divCont.node()
      selection
      selections
    }
  ).bind('blur', close)

  updateSelection = ->
    if title
      valueSpan.text(title.value())
    else
      sel = selection.value()
      selLabel = selectionLabel.value()
      valueSpan.text(selLabel(sel))
    return

  dvl.register {
    name: 'selection_updater'
    listen: [selection, selectionLabel, title]
    fn: updateSelection
  }

  return {
    node: divCont.node()
    menuCont: menuCont.node()
    selection
  }


##-------------------------------------------------------
##
##  Select (dropdown box) made with HTML
##
dvl.html.select = ({parent, data, label, selection, onChange, classStr, visible}) ->
  throw 'must have parent' unless parent
  throw 'must have data' unless data
  selection = dvl.wrapVar(selection, 'selection')
  visible = dvl.wrap(visible ? true)

  data = dvl.wrap(data)
  label = dvl.wrap(label or dvl.identity)

  selChange = ->
    _data = data.value()
    if _data
      _data = _data.valueOf()
      _selectEl = selectEl.value()
      i = _selectEl.property('value')
      val = _data[i]
      return if onChange?(val) is false
      selection.value(val)
    else
      selection.value(null)
    return

  selectEl = dvl.bindSingle {
    parent
    self: 'select'
    attr: {
      class: classStr or null
    }
    style: {
      display: dvl.op.iff(visible, null, 'none')
    }
    on: {
      change: selChange
    }
  }

  dvl.bind {
    parent: selectEl
    self: 'option'
    data
    attr: {
      value: (d,i) -> i
    }
    text: label
  }

  dvl.register {
    listen: [data, selection]
    fn: ->
      _data = data.value()
      _selection = selection.value()
      return unless _data
      _data = _data.valueOf()
      idx = _data.indexOf(_selection)
      _selectEl = selectEl.value()
      if _selectEl.property('value') isnt idx
        _selectEl.property('value', idx)
      return
  }

  selChange()
  return selection



dvl.compare = (acc, reverse, ignoreCase) ->
  acc = dvl.wrap(acc or dvl.ident)
  reverse = dvl.wrap(reverse or false)
  ignoreCase = dvl.wrap(ignoreCase or false)
  return dvl.apply {
    args: [acc, reverse, ignoreCase]
    fn: (acc, reverse, ignoreCase) ->
      toStr = if ignoreCase then (x) -> String(x).toLowerCase() else String

      numCmp = if reverse
        (a,b) -> b - a
      else
        (a,b) -> a - b

      strCmp = if reverse
        (a,b) -> toStr(b).localeCompare(toStr(a))
      else
        (a,b) -> toStr(a).localeCompare(toStr(b))

      return (a,b) ->
        va = acc(a)
        vb = acc(b)
        t = typeof va
        return if t is 'number' then numCmp(va,vb) else strCmp(va,vb)
  }


##-------------------------------------------------------
##
##  Table made with HTML
##
##  This module draws an HTML table that can be sorted
##
##  parent:      Where to append the table.
## ~data:        The data displayed.
##  classStr:    The class to add to the table.
## ~rowClass:    The generator for row classes
## ~visible:     Toggles the visibility of the table. [true]
##  columns:     A list of columns to drive the table.
##    column:
##      id:               The id by which the column will be identified.
##     ~title:            The title of the column header.
##     ~headerTooltip:    The popup tool tip (title element text) of the column header.
##      classStr:         The class given to the 'th' and 'td' elements in this column, if not specified will default to the id.
##      cellClassGen:     The class generator for the cell
##     ~cellClick:        The generator of click handlers
##     ~value:            The value of the cell
##      sortable:         Toggles wheather the column is sortable or not. [true]
##     ~compare:          The generator that will drive the sorting, if not provided then gen will be used instead. [gen]
##     ~compareModes:        ['none', 'up', 'down']
##     ~hoverGen:         The generator for the (hover) title.
##     ~showIndicator:    Toggle the display of the sorting indicator for this column. [true]
##     ~reverseIndicator: Reverses the asc / desc directions of the indicator for this column. [false]
##     ~visible:          Toggles the visibility of the column
##
##  sort:
##   ~on:              The id of the column on which to sort.
##   ~onIndicator:     The id of the column on which the indicator is palced (defaults to sort.on)
##   ~order:           The order of the sort. Must be one of {'asc', 'desc', 'none'}.
##   ~modes:           The order rotation that is allowed. Must be an array of [{'asc', 'desc', 'none'}].
##   ~autoOnClick:     Toggle wheather the table will be sorted (updating sort.on and/or possibly sort.order) automaticaly when clicked. [true]
##   ~indicator:       [true / false]
##
## ~showHeader:        Toggle showing the header [true]
## ~onHeaderClick:     Callback or url when the header of a column is clicked.
## ~headerTooltip:     The default herder tooltip (title element text).
## ~rowLimit:          The maximum number of rows to show; if null all the rows are shown. [null]
##
do ->
  default_compare_modes = ['up', 'down']
  dvl.html.table = ({parent, data, sort, classStr, rowClass, rowLimit, columns, on:onRow}) ->
    table = dvl.bindSingle {
      parent
      self: 'table'
      attr: {
        class: classStr
      }
    }

    sort or= {}
    sortOn = dvl.wrapVar(sort.on)
    sortDir = dvl.wrapVar(sort.dir)
    sortOnIndicator = dvl.wrapVar(sort.onIndicator ? sortOn)

    headerCol = []
    bodyCol = []
    compareMap = {}
    compareList = [sortOn, sortDir]
    for c in columns
      if c.sortable
        if c.compare?
          comp = dvl.wrap(c.compare)
        else
          comp = dvl.compare(c.value)
        compareMap[c.id] = comp
        compareList.push comp

        if not c.compareModes
          c.compareModes = default_compare_modes

      headerCol.push {
        id:       c.id
        title:    c.title
        class:    (c.class or '') + (if c.sortable then ' sortable' else '')
        visible:  c.visible
        tooltip:  c.headerTooltip
      }
      bodyCol.push {
        id:       c.id
        class:    c.class
        visible:  c.visible
        value:    c.value
        hover:    c.hover
        render:   c.render
        on:       c.on
      }

    headerCol.forEach (c) ->
      c.indicator = dvl.apply([sortOn, sortDir], (so, sd) -> if so is c.id then sd else 'none')
      return

    compare = dvl(null)
    dvl.register {
      listen: compareList
      change: [compare]
      fn: ->
        _sortOn = sortOn.value()
        _sortDir = sortDir.value()

        if _sortOn?
          cmp = compareMap[_sortOn]?.value()
          if cmp and _sortDir is 'down'
            oldCmp = cmp
            cmp = (a,b) -> oldCmp(b,a)
          compare.value(cmp)
        else
          compare.value(null)
        return
    }

    dvl.html.table.header {
      parent: table
      columns: headerCol
      onClick: (id) ->
        column = null
        for c in columns
          if c.id is id
            column = c
            break

        return unless column and column.sortable

        compareModes = column.compareModes
        if id is sortOn.value()
          sortDir.set(compareModes[(compareModes.indexOf(sortDir.value())+1) % compareModes.length])
          dvl.notify(sortDir)
        else
          sortOn.set(id)
          sortDir.set(compareModes[0])
          dvl.notify(sortOn, sortDir)

        return
    }

    dvl.html.table.body {
      parent: table
      classStr: 'data'
      data
      rowClass
      rowLimit
      columns: bodyCol
      compare
      on:      onRow
    }

    return {}


  ##-------------------------------------------------------
  ##
  ##  HTML table header (thead)
  ##
  ##  parent:      Where to append the table.
  ## ~onClick:     The click handler
  ##  columns:
  ##   ~title:       The title of the column.
  ##   ~class:       The class of the column
  ##   ~tooltip:     The tooltip for the column
  ##   ~visible:     Is this visible
  ##   ~indicator:   The column indicator
  ##
  dvl.html.table.header = ({parent, columns, onClick}) ->
    throw 'there needs to be a parent' unless parent
    onClick = dvl.wrap(onClick)

    thead = dvl.valueOf(parent).append('thead').append('tr')

    listen = [onClick]
    newColumns = []
    for c in columns
      newColumns.push(nc = {
        id:        c.id
        title:     dvl.wrap(c.title)
        class:     dvl.wrap(c.class)
        visible:   dvl.wrap(c.visible ? true)
        tooltip:   dvl.wrap(c.tooltip)
        indicator: dvl.wrap(c.indicator) if c.indicator
      })
      listen.push nc.title, nc.class, nc.visible, nc.tooltip, nc.indicator

    columns = newColumns

    # Init step
    sel = thead.selectAll('th').data(columns)
    enterTh = sel.enter().append('th')
    enterTh.append('span')
    enterTh.append('div').attr('class', 'indicator').style('display', 'none')

    sel.exit().remove()

    dvl.register {
      name: 'header_render'
      listen
      fn: ->
        for c,i in columns
          sel = thead.select("th:nth-child(#{i+1})")
          visibleChanged = c.visible.hasChanged()
          if c.visible.value()
            sel.datum(c)
            sel.attr('class', c.class.value())       if c.class.hasChanged() or visibleChanged
            sel.attr('title', c.tooltip.value())     if c.tooltip.hasChanged() or visibleChanged
            sel.attr('title', c.tooltip.value())     if c.tooltip.hasChanged() or visibleChanged
            sel.style('display', null)             if visibleChanged
            sel.on('click', (d) -> onClick.value()?(d.id)) if onClick.hasChanged() or visibleChanged
            sel.select('span').text(c.title.value()) if c.title.hasChanged() or visibleChanged

            if c.indicator and (c.indicator.hasChanged() or visibleChanged)
              _indicator = c.indicator.value()
              ind = sel.select('div.indicator')
              if _indicator
                ind.style('display', null).attr('class', 'indicator ' + _indicator)
              else
                ind.style('display', 'none')
          else
            sel.style('display', 'none')           if visibleChanged

        return
    }

    return

  ##-------------------------------------------------------
  ##
  ##  HTML table body (tbody)
  ##
  ##  parent:      Where to append the table.
  ## ~data:        The data displayed.
  ## ~compare:        The function to sort the data on
  ## ~rowClass       The class of the row
  ## ~rowLimit:          The maximum number of rows to show; if null all the rows are shown. [null]
  ##  columns:
  ##   ~value:       The value of the cell
  ##   ~class:       The class of the column
  ##   ~hover:       The hover
  ##   ~visible:     This this column shown?
  ##    on:          Whatever on events you want
  ##
  dvl.html.table.body = ({parent, data, compare, rowClass, classStr, rowLimit, columns, on:onRow}) ->
    throw 'there needs to be a parent' unless parent
    throw 'there needs to be data' unless data
    tbody = dvl.valueOf(parent).append('tbody').attr('class', classStr)

    compare = dvl.wrap(compare)
    rowClass = dvl.wrap(rowClass) if rowClass?
    rowLimit = dvl.wrap(rowLimit)
    listen = [data, compare, rowClass, rowLimit]
    change = []

    onRowNew = {}
    for k,v of onRow
      v = dvl.wrap(v)
      listen.push v
      onRowNew[k] = v
    onRow = onRowNew

    newColumns = []
    for c in columns
      newColumns.push(nc = {
        id:      c.id
        class:   dvl.wrap(c.class)
        visible: dvl.wrap(c.visible ? true)
        hover:   dvl.wrap(c.hover)
        value:   dvl.wrap(c.value)
      })
      # don't listen to value which is handled by the render
      listen.push nc.class, nc.visible, nc.hover

      nc.render = c.render or 'text'

      nc.on = {}
      for k,v of c.on
        v = dvl.wrap(v)
        listen.push v
        nc.on[k] = v

      change.push(nc.selection = dvl().name("#{c.id}_selection"))

    columns = newColumns

    dvl.register {
      name: 'body_render'
      listen
      change
      fn: ->
        dataSorted = (data.value() or []).valueOf()

        _compare = compare.value()
        dataSorted = dataSorted.slice().sort(_compare) if _compare

        _rowLimit = rowLimit.value()
        dataSorted = dataSorted.slice(0, _rowLimit) if _rowLimit?

        rowSel = tbody.selectAll('tr').data(dataSorted)
        enterRowSel = rowSel.enter().append('tr')
        rowSel.exit().remove()
        if rowClass
          _rowClass = rowClass.value()
          rowSel.attr('class', _rowClass)

        for k,v of onRow
          rowSel.on(k, v.value())

        colSel = rowSel.selectAll('td').data(columns)
        colSel.enter().append('td')
        colSel.exit().remove()

        for c,i in columns
          sel = tbody.selectAll("td:nth-child(#{i+1})").data(dataSorted)
          visibleChanged = c.visible.hasChanged() or data.hasChanged()
          if c.visible.value()
            sel.attr('class', c.class.value()) if c.class.hasChanged() or visibleChanged
            sel.attr('title', c.hover.value()) if c.hover.hasChanged() or visibleChanged
            sel.style('display', null)       if visibleChanged

            for k,v of c.on
              sel.on(k, v.value()) if v.hasChanged() or visibleChanged

            c.selection.set(sel).notify()
          else
            sel.style('display', 'none') if visibleChanged

        return
    }

    for c in columns
      render = if typeof c.render is 'function' then c.render else dvl.html.table.render[c.render]
      render.call(c, c.selection, c.value)

    return


  dvl.html.table.render = {
    text: (selection, value) ->
      dvl.register {
        listen: [selection, value]
        fn: ->
          _selection = selection.value()
          _value = value.value()
          if _selection? and _value
            _selection.text(_value)
          return selection
      }
      return

    html: (selection, value) ->
      dvl.register {
        listen: [selection, value]
        fn: ->
          _selection = selection.value()
          _value = value.value()
          if _selection? and _value
            _selection.html(_value)
          return selection
      }
      return


    aLink: ({href}) -> (selection, value) ->
      return dvl.bind {
        parent: selection
        self: 'a.link'
        attr: {
          href: href
        }
        text: value
      }

    img: (selection, value) ->
      return dvl.bind {
        parent: selection
        self: 'img'
        attr: {
          src: value
        }
      }

    imgDiv: (selection, value) ->
      return dvl.bind {
        parent: selection
        self: 'div'
        attr: {
          class: value
        }
      }

    sparkline: ({width, height, x, y, padding}) ->
      padding ?= 0
      return (selection, value) ->
        lineFn = dvl.apply {
          args: [x, y, padding]
          fn: (x, y, padding) -> (d) ->
            mmx = dvl.util.getMinMax(d, ((d) -> d[x]))
            mmy = dvl.util.getMinMax(d, ((d) -> d[y]))
            sx = d3.scale.linear().domain([mmx.min, mmx.max]).range([padding, width-padding])
            sy = d3.scale.linear().domain([mmy.min, mmy.max]).range([height-padding, padding])
            return d3.svg.line().x((dp) -> sx(dp[x])).y((dp) -> sy(dp[y]))(d)
        }

        dataFn = dvl.apply {
          args: value
          fn: (value) -> (d,i) -> [value(d,i)]
        }

        svg = dvl.bind {
          parent: selection
          self: 'svg.sparkline'
          data: dataFn
          attr: {
            width
            height
          }
        }

        return dvl.bind {
          parent: svg
          self: 'path'
          data: (d) -> [d]
          attr: {
            d: lineFn
          }
        }
  }
# HTML # --------------------------------------------------

dvl.html = {}

# Capture the size of something in HTML
#
dvl.html.resizer = ({selector, out, dimension}) ->
  out = dvl.wrapVar(out)
  dimension = dvl.wrap(dimension or 'width')

  onResize = ->
    _dimension = dimension.value()
    if _dimension in ['width', 'height']
      if selector
        e = jQuery(selector)
        val = e[_dimension]()
      else
        val = document.body[if _dimension is 'width' then 'clientWidth' else 'clientHeight']

      out.value(val)
    else
      out.value(null)

  $(window).resize(onResize)
  dvl.register {
    listen: dimension
    change: out
    fn: onResize
  }
  return out

# Output to an HTML attribute
# DEPRICATED
dvl.html.out = ({selector, data, fn, format, invalid, hideInvalid, attr, style, text}) ->
  throw new Error('must have data') unless data
  data = dvl.wrap(data)
  format = format ? fn

  throw new Error('must have selector') unless selector
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

  updateHtml = ->
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

  dvl.register {
    listen: [data, selector, format]
    fn: updateHtml
  }
  return

# Renders a dropdown
#
# @param {DVL(d3.selection)} parent, where to attach the dropdown
# @param {DVL(String} classStr ["dropdown"], the class of the added dropdown
# @param {DVL(Array(d))} data, the data to be contained in the dropdown
# @param {DVL(Function(d -> String))} [String] value, the data to value function for the list
# @param {DVL(Function(d -> String))} [value] selectionValue, the data to value function for the selection itself
# @param {DVL(String)} [null] title, set selectionValue to a static text
dvl.html.dropdown = ({parent, classStr, data, value, selectionValue, title, render, class:listClass, id,
                      selection, highlight, onSelect, keepOnClick, visible, disabled, focus, spacers, combo}) ->
  throw new Error('must have parent') unless parent
  throw new Error('must have data') unless data
  classStr or= 'dropdown'

  selection = dvl.wrapVar(selection)
  highlight = dvl.wrapVar(highlight)
  render ?= dvl.html.dropdown.render.text

  data = dvl.wrap(data)
  value = dvl.wrap(value or String)
  selectionValue = dvl.apply(title, (_title) -> () -> _title) if title and not selectionValue
  selectionValue = dvl.wrap(selectionValue or value)

  keepOnClick = dvl.wrap(keepOnClick or true)
  disabled = dvl.wrap(disabled ? false)
  visible = dvl.wrap(visible ? true)
  focus = dvl.wrapVar(focus)

  searchText = dvl(null)
  dvl.debug 'searchText', searchText
  dvl.debug 'highlight', highlight

  spacerDummy = {} # Dummy object to indicate spacers
  blankHighlight = {} # Highlight could be highlighting null to this is the "no highlight" value

  if listClass?
    listClass = dvl.wrap(listClass)
  else
    listClass = dvl.applyAlways(
      [selection, highlight]
      (_selection, _highlight) -> (d) ->
        return [
          if d is _selection then 'is-selection' else 'isnt-selection'
          if d is _highlight then 'is-highlight' else 'isnt-highlight'
        ].join(' ')
    )

  # Make sure that the selection is always within the data
  dvl.register {
    listen: data
    #change: selection
    fn: ->
      _data = data.value()
      _selection = selection.value()
      if not _data or _selection not in _data
        # Hack for when this makes a circular dependency
        setTimeout((-> selection.value(null)), 0)
      return
  }

  title = dvl.wrap(title) if title

  menuOpen = dvl(false)

  divCont = dvl.bindSingle({
    parent
    self: 'div'
    attr: {
      class: dvl.applyAlways {
        args: [classStr, menuOpen, disabled]
        fn: (_classStr, _menuOpen, _disabled) -> [
          _classStr or '',
          if _menuOpen then 'open' else 'closed'
          if _disabled then 'disabled' else ''
        ].join(' ')
      }
    }
  })

  valueOut = dvl.bindSingle {
    parent: divCont
    self: (if combo then 'input' else 'div') + '.title-cont'
    attr: {
      id: id
      disabled: dvl.op.iff(disabled, '', null)
      tabIndex: 0
    }
    style: {
      display: dvl.op.iff(visible, null, '')
    }
    on: {
      blur: ->
        focus.value(false)
        return
    }
    text: if combo then null else dvl.applyAlways(selection, value)
  }

  if combo
    dvl.register {
      listen: [valueOut, selection, selectionValue]
      fn: ->
        _valueOut = valueOut.value()
        return unless _valueOut
        _selection = selection.value()
        _selectionValue = selectionValue.value()
        console.log _selectionValue, _selection
        _valueOut.property('value', _selectionValue?(_selection) ? '')
        return
    }

    shownData = dvl.applyAlways(
      [data, value, searchText]
      (_data, _value, _searchText) ->
        return _data unless _searchText
        _searchText = _searchText.toLowerCase()
        return _data.filter((d) -> _value(d).toLowerCase().indexOf(_searchText) isnt -1)
    )

    dvl.register {
      listen: [shownData, searchText]
      change: highlight
      fn: ->
        return unless searchText.value() and searchText.hasChanged()
        return unless highlight.value() is blankHighlight
        highlight.value()
        return
    }
  else
    shownData = data

  dvl.register {
    listen: [menuOpen, shownData, searchText]
    change: highlight
    fn: ->
      if menuOpen.value()
        _shownData = shownData.value()
        _highlight = highlight.value()
        return unless combo and searchText.value() and searchText.hasChanged() and _shownData.indexOf(_highlight) is -1
        highlight.value(_shownData[0] or blankHighlight)
      else
        highlight.value(blankHighlight)
      return
  }

  updateScroll = ->
    _menuCont = menuCont.value()
    _data = data.value()
    return unless _menuCont and _data

    # Use the highlight, if no highlight use the selection
    scrollIndex = _data.indexOf(highlight.value())
    scrollIndex = _data.indexOf(selection.value()) if scrollIndex is -1
    return if scrollIndex is -1

    menuContNode = _menuCont.node()
    return if menuContNode.scrollHeight is 0
    element = _menuCont.selectAll('li.item')[0][scrollIndex]
    return unless element
    position = $(element).position()
    menuContNode.scrollTop = 0
    menuContNode.scrollTop = position.top
    return

  valueOut.value()
    .on('keydown', dvl.group(->
      _data = data.value()
      _value = value.value()
      return unless _data and _value

      keyCode = d3.event.which or d3.event.keyCode

      switch keyCode
        when 9 # tab = 9
          # Do not block tab keys
          menuOpen.value(false)

        when 38, 40 # up arrow = 38 | down arrow = 40
          d3.event.stopPropagation()
          d3.event.preventDefault()

          if not menuOpen.value()
            menuOpen.value(true)

          # Increment highlight

          highlightIndex = _data.indexOf(highlight.value())
          if highlightIndex is -1 and keyCode is 38
            # Up arrow is pressed with no valid highlight: place highlight at the bottom.
            highlightIndex = _data.length

          # Move the highlight
          if keyCode is 38 then highlightIndex-- else highlightIndex++

          # Clamp the highlight
          highlightIndex = Math.min(Math.max(highlightIndex, 0), _data.length - 1)

          highlight.value(_data[highlightIndex])
          updateScroll()

        when 13, 27 # enter = 13, esc = 27
          d3.event.stopPropagation()
          d3.event.preventDefault()

          if keyCode is 13 and highlight.value() isnt blankHighlight
            selection.value(highlight.value())

          menuOpen.value(false)

      if combo
        setTimeout((->
          searchText.value(valueOut.value().property('value'))
        ), 1)
      return
    ), true) # Capture

  if not combo
    valueOut.value()
      .on('keypress', (->
        _data = data.value()
        _value = value.value()
        return unless _data and _value

        keyCode = d3.event.which or d3.event.keyCode
        userChar = String.fromCharCode(keyCode).toLowerCase()
        return if not userChar or keyCode in [9, 38, 40, 13, 27]

        for datum in _data
          if datum and _value(datum).charAt(0).toLowerCase() is userChar
            highlight.value(datum)
            updateScroll()
            break

        return
      ), true) # Capture

  dvl.register {
    listen: focus
    fn: ->
      _valueOut = valueOut.value()
      return unless _valueOut

      _focus = focus.value()
      return unless _focus?
      valueOutNode = _valueOut.node()
      return if _focus is (valueOutNode is document.activeElement)
      setTimeout((-> # We need this defer because it seems that the blur of another element is called synchronously
        if _focus then valueOutNode.focus() else valueOutNode.blur()
        return
      ), 0)
      return
  }

  myOnSelect = (d, i) ->
    menuOpen.value(false) unless keepOnClick.value()
    return if onSelect?(d, i) is false
    selection.value(d)
    return

  if spacers
    dataWithSpacers = dvl.applyAlways {
      args: [shownData, spacers, searchText]
      fn: (_shownData, _spacers, _searchText) ->
        return null unless _shownData
        return _shownData unless _spacers and not _searchText
        spacerAt = {}
        spacerAt[si] = 1 for si in _spacers

        _dataWithSpacers = []
        for d, i in _shownData
          _dataWithSpacers.push(spacerDummy) if spacerAt[i]
          _dataWithSpacers.push(d)

        _dataWithSpacers.push(spacerDummy) if spacerAt[_shownData.length]
        return _dataWithSpacers
    }
  else
    dataWithSpacers = shownData

  menuCont = dvl.bindSingle({
    parent: divCont
    self: 'ul.menu-cont'
    attr: {
      class: dvl.applyAlways {
        args: dataWithSpacers
        fn: (_data) -> if _data and _data.length then '' else 'empty'
      }
    }
    style: {
      display: dvl.op.iff(menuOpen, null, 'none')
    }
  })

  listItems = dvl.bind {
    parent: menuCont
    data: dataWithSpacers
    self: 'li'
    attr: {
      class: dvl.op.concat(listClass, (d) -> if d is spacerDummy then ' spacer' else ' item')
    }
    on: {
      click: myOnSelect
      mouseover: (d) ->
        highlight.value(d)
        return
      mouseout: ->
        highlight.value(blankHighlight)
        return
    }
  }

  realDataItems = dvl.apply {
    args: [menuCont, listItems]
    fn: (_menuCont) -> _menuCont.selectAll('li.item')
  }

  render(realDataItems, value)

  namespace = dvl.namespace('dropdown')
  d3.select(window)
    .on("click.#{namespace}", (->
      _divCont = divCont.value()
      _menuCont = menuCont.value()
      return unless _divCont and _menuCont

      target = d3.event.target
      return if disabled.value()
      return if $(_menuCont.node()).find(target).length

      if _divCont.node() is target or $(_divCont.node()).find(target).length
        menuOpen.value(not menuOpen.value())
      else
        menuOpen.value(false)

      return
    ), true) # Use capture
    .on("blur.#{namespace}", ->
      menuOpen.value(false)
      return
    )

  return {
    node: divCont
    menuCont: menuCont
    open: menuOpen
    focus
    selection
    highlight
  }

dvl.html.dropdown.render = {
  text: (selection, value) ->
    dvl.bind {
      parent: selection
      self: 'span'
      text: value
    }
    return
}



##-------------------------------------------------------
##
##  Select (dropdown box) made with HTML
##
dvl.html.select = ({parent, data, classStr, value, label, selection, id, onChange, focus, visible}) ->
  throw new Error('must have parent') unless parent
  throw new Error('must have data') unless data
  selection = dvl.wrapVar(selection, 'selection')
  focus = dvl.wrapVar(focus ? false)
  visible = dvl.wrap(visible ? true)

  data = dvl.wrap(data)
  value or= label
  value = dvl.wrap(value or String)

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
      id
      class: classStr
    }
    style: {
      display: dvl.op.iff(visible, null, 'none')
    }
    on: {
      change: selChange
      focus: ->
        focus.value(true)
        return
      blur: ->
        focus.value(false)
        return
    }
  }

  dvl.bind {
    parent: selectEl
    self: 'option'
    data
    attr: {
      value: (d,i) -> i
    }
    text: value
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

  dvl.register {
    listen: [selectEl, focus]
    fn: ->
      _selectEl = selectEl.value()
      _focus = focus.value()
      return unless _selectEl and _focus?
      _selectEl = _selectEl.node()
      return _focus is (_selectEl is document.activeElement)
      if _focus
        _selectEl.focus()
      else
        _selectEl.blur()
      return
  }

  selChange()
  return {
    node: selectEl.value()
    selection
    focus
  }

dvl.compare = (acc, reverse) ->
  acc = dvl.wrap(acc or dvl.identity)
  reverse = dvl.wrap(reverse or false)
  return dvl.apply {
    args: [acc, reverse]
    fn: (acc, reverse) ->
      cmp = if reverse then d3.descending else d3.ascending
      return (a, b) -> cmp(acc(a), acc(b))
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
##     ~width:            The width of the column
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
  defaultCompareModes = ['up', 'down']

  numberRegEx = /\d+(?:\.\d+)?/
  addPxIfNeeded = (str) ->
    return null unless str?
    return if numberRegEx.test(str) then str + 'px' else str

  dvl.html.table = ({parent, headParent, data, sort, classStr, rowClass, rowLimit, columns, on:onRow}) ->
    table = dvl.bindSingle {
      parent
      self: 'table'
      attr: {
        class: classStr
      }
    }

    if headParent
      headTable = dvl.bindSingle {
        parent: headParent
        self: 'table'
        attr: {
          class: (classStr ? '') + ' head'
        }
      }
    else
      headTable = table

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
          if c.ignoreCase
            comp = dvl.compare(dvl.chain(c.value, (d) -> if d then d.toLowerCase() else d))
          else
            comp = dvl.compare(c.value)
        compareMap[c.id] = comp
        compareList.push comp

        if not c.compareModes
          c.compareModes = defaultCompareModes

      headerCol.push {
        id:       c.id
        title:    c.title
        class:    (c.class or '') + (if c.sortable then ' sortable' else '')
        visible:  c.visible
        tooltip:  c.headerTooltip
        width:    c.width
      }
      bodyCol.push {
        id:       c.id
        class:    c.class
        visible:  c.visible
        value:    c.value
        hover:    c.hover
        render:   c.render
        on:       c.on
        width:    c.width
      }

    headerCol.forEach (c) ->
      c.indicator = dvl.applyAlways [sortOn, sortDir], (_sortOn, _sortDir) ->
        return if _sortOn is c.id then (_sortDir or 'none') else 'none'
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
      parent: headTable
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

    return {
      node: table
    }


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
  ##   ~width:       The width of the column
  ##
  dvl.html.table.header = ({parent, columns, onClick}) ->
    throw new Error('there needs to be a parent') unless parent
    onClick = dvl.wrap(onClick)

    thead = dvl.valueOf(parent).append('thead')
    headerRow = thead.append('tr')

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
        width:     dvl.wrap(c.width)
      })
      listen.push nc.title, nc.class, nc.visible, nc.tooltip, nc.indicator, nc.width

    columns = newColumns

    # Init step
    sel = headerRow.selectAll('th').data(columns)
    enterTh = sel.enter().append('th')
    enterLiner = enterTh.append('div')
      .attr('class', 'liner')

    enterLiner.append('span')
    enterLiner.append('div')
      .attr('class', 'indicator')
      .style('display', 'none')

    sel.exit().remove()

    dvl.register {
      name: 'header_render'
      listen
      fn: ->
        for c,i in columns
          sel = headerRow.select("th:nth-child(#{i+1})")
          visibleChanged = c.visible.hasChanged()
          if c.visible.value()
            sel.datum(c)

            if c.class.hasChanged() or visibleChanged
              sel.attr('class', c.class.value())

            if c.tooltip.hasChanged() or visibleChanged
              sel.attr('title', c.tooltip.value())

            if c.width.hasChanged() or visibleChanged
              w = addPxIfNeeded(c.width.value())
              sel
                .style('min-width', w)
                .style('width', w)
                .style('max-width', w)

            if visibleChanged
              sel.style('display', null)

            if onClick.hasChanged() or visibleChanged
              sel.on('click', (d) -> onClick.value()?(d.id))

            if c.title.hasChanged() or visibleChanged
              sel.select('span').text(c.title.value())

            if c.indicator and (c.indicator.hasChanged() or visibleChanged)
              _indicator = c.indicator.value()
              ind = sel.select('div.indicator')
              if _indicator
                ind.style('display', null).attr('class', 'indicator ' + _indicator)
              else
                ind.style('display', 'none')
          else
            sel.style('display', 'none') if visibleChanged

        return
    }

    return {
      node: thead
    }

  ##-------------------------------------------------------
  ##
  ##  HTML table body (tbody)
  ##
  ##  parent:     Where to append the table.
  ## ~data:       The data displayed.
  ## ~compare:      The function to sort the data on
  ## ~rowClass      The class of the row
  ## ~rowLimit:     The maximum number of rows to show; if null all the rows are shown. [null]
  ##  columns:
  ##   ~value:      The value of the cell
  ##   ~class:      The class of the column
  ##   ~hover:      The hover
  ##   ~visible:    This this column shown?
  ##    on:         Whatever on events you want
  ##   ~width:      The width of the column
  ##
  dvl.html.table.body = ({parent, data, compare, rowClass, classStr, rowLimit, columns, on:onRow}) ->
    throw new Error('there needs to be a parent') unless parent
    throw new Error('there needs to be data') unless data
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
        width:   dvl.wrap(c.width)
      })
      # don't listen to value which is handled by the render
      listen.push nc.class, nc.visible, nc.hover, nc.width

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
            if c.class.hasChanged() or visibleChanged
              sel.attr('class', c.class.value())

            if c.hover.hasChanged() or visibleChanged
              sel.attr('title', c.hover.value())

            if c.width.hasChanged() or visibleChanged
              w = addPxIfNeeded(c.width.value())
              sel
                .style('min-width', w)
                .style('width', w)
                .style('max-width', w)

            if visibleChanged
              sel.style('display', null)

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

    return {
      node: tbody
    }


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

    button: ({classStr, on: onObj}) -> (selection, value) ->
      return dvl.bind {
        parent: selection
        self: 'button'
        attr: {
          class: classStr
        }
        on: onObj
        text: value
      }

    sparkline: ({width, height, x, y, padding}) ->
      padding ?= 0
      return (selection, value) ->
        lineFn = dvl.apply {
          args: [x, y, padding]
          fn: (x, y, padding) -> (d) ->
            sx = d3.scale.linear().domain(d3.extent(d, (d) -> d[x])).range([padding,  width - padding])
            sy = d3.scale.linear().domain(d3.extent(d, (d) -> d[y])).range([height - padding, padding])
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




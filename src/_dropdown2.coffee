


# Renders a dropdown
#
# @param {DVL(d3.selection)} parent, where to attach the dropdown
# @param {DVL(String} classStr ["dropdown"], the class of the added dropdown
# @param {DVL(Array(d))} data, the data to be contained in the dropdown
# @param {DVL(Function(d -> String))} [String] value, the data to value function for the list
# @param {DVL(Function(d -> String))} [value] selectionValue, the data to value function for the selection itself
# @param {DVL(String)} [null] title, set selectionValue to a static text
dvl.html.dropdown2 = ({parent, classStr, data, value, selectionValue, title, render, class:listClass, id,
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

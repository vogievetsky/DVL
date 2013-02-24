"use strict";

var data = dvl("Hello,How,Are,You,Would,You,Give,Me,Your,Name".split(','))

dvl.html.table2 = function(_arg) {
  var table = dvl.bindSingle({
    parent: _arg.parent,
    self: 'table',
    attr: {class: _arg.classStr}
  })

  var headTable = table;

  var sort = {};
  var sortOn = dvl.wrapVar(sort.on);
  var sortDir = dvl.wrapVar(sort.dir);
  var sortOnIndicator = sortOn;
}

dvl.html.table2({
  parent: d3.select('body'),
  data: data,
  columns: [{
    id: 'word',
    title: 'Word',
    value: dvl.identity,
    sortable: true
  }, {
    id: 'first',
    title: 'First',
    value: function(d) { return d[0] },
    sortable: true
  }, {
    id: 'last',
    title: 'Last',
    value: function(d) { return d[d.length-1] },
    sortable: true
  }],
  classStr: "dvlTable"
});

/*
 dvl.html.table2 = ({parent, headParent, data, sort, classStr, rowClass, rowLimit, columns, on:onRow}) ->
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
*/






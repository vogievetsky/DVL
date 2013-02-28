mmx = {};
mmx.ui = {};

/*
mmx.ui.form = ({parent, classStr}) ->
  form = parent.append('div')
    .attr('class', 'ui-form ' + (classStr or 'normal'))

  return {
    get: ->
      return form

    addLine: ({classStr, visible} = {}) ->
      visible = dvl.wrap(visible ? true)
      line = dvl.bindSingle {
        parent: form
        self: 'div.line'
        attr: {
          class: classStr
        }
        style: {
          display: dvl.op.iff(visible, null, 'none')
        }
      }

      makeField = (label, uid, classStr, visible, disabled) ->
        visible = dvl.wrap(visible ? true)
        field = dvl.bindSingle({
          parent: line
          self: 'div.field' + if classStr then '.' + classStr else ''
          attr: {
            class: dvl.op.iff(disabled, 'disabled', null)
          }
          style: {
            display: dvl.op.iff(visible, null, 'none')
          }
        }).value()

        if label
          labelEl = field.append('label')
            .attr('class', 'field-label')
            .text(label)
          labelEl.attr('for', uid) if uid

        return field

      return {
        get: -> line.value()

        addTextField: (label, {text, classStr, type, name, placeholder, maxLength, readOnly, validators, ignoreEmpty, visible, disabled, on: onObj, trim, clearButton} = {}) ->
          validators or= []
          ignoreEmpty = dvl.wrap(ignoreEmpty ? true)
          uid = uniquId()
          field = makeField(label, uid, classStr, visible, disabled)

          text = dvl.wrapVar(text)
          focus = dvl.def()
          error = dvl.def()

          clearableContainer = dvl.bindSingle({
            parent: field
            self: "div.clearable-field"
          }).value()

          { node } = dvl_html_input {
            parent: clearableContainer
            classStr: 'text-field'
            value: text
            focus
            id: uid
            placeholder
            maxLength
            readOnly
            type: type or 'text'
            name
            ignoreEmpty
            disabled
            on: onObj
          }
   
          dvl.bindSingle({
            parent: clearableContainer
            self: 'div.delete-button'
            datum: clearButton
            display: (d) -> d? and d
            on: {
              click: ->
                text.value('')
            }
          })

          dvl.register {
            listen: focus
            change: ignoreEmpty
            noRun: true
            fn: ->
              if focus.value() is true
                ignoreEmpty.value(true)
              return
          }

          getError = (str) ->
            str = str.trim() if trim
            for v in validators
              if not v.fn(str)
                return v.error
            return null

          dvl.register {
            listen: [text, focus, ignoreEmpty]
            change: [error]
            fn: ->
              _focus = focus.value()
              if _focus
                error.value(null)
                return

              _text = text.value() or ''
              _ignoreEmpty = ignoreEmpty.value()

              if _ignoreEmpty and not _text
                error.value(null)
                return

              error.value(getError(_text))
              return
          }

          dvl.bindSingle {
            parent: field
            self: 'div.warning'
            text: error
          }

          dvl.register {
            listen: error
            fn: ->
              field.classed('error', Boolean(error.value()))
              return
          }

          validText = text.project({
            down: (str) ->
              str = str.trim() if trim
              return if getError(str) then null else str
            up:   (str) -> str
          })

          return {
            field
            node
            text
            error
            focus
            validText
          }

        addTextFieldCompliment: ({classStr, text, visible, disabled}) ->
          field = makeField(null, null, classStr, visible, disabled)
          s = dvl.bindSingle {
            parent: field
            self: 'span.compliment'
            text
          }
          return {
            node: s.value()
          }

        addSelectField: (label, {selection, classStr, data, labelFn, visible, disabled, useSelect, defaultLabel, readOnly, sortOn, ignoreCase, onSelect} = {}) ->
          uid = uniquId()
          field = makeField(label, uid, classStr, visible, disabled)
          selection = dvl.wrapVar(selection)
          defaultLabel or= '--'

          if sortOn
            data = dvl.apply [data, sortOn, ignoreCase], (_data, _sortOn, _ignoreCase) ->
              if _ignoreCase
                getValue = (d) ->
                  v = _sortOn(d)
                  return if v then v.toLowerCase() else v
              else
                getValue = _sortOn

              return _data.slice().sort((a, b) -> d3.ascending(getValue(a), getValue(b)))

          labelFn or= String
          if useSelect
            { node } = dvl.html.select {
              parent: field
              classStr: dvl.op.iff(readOnly, 'read-only', '')
              id: uid
              data
              label: labelFn
              selection
              disabled: dvl.op.or(disabled, readOnly)
              onSelect
            }
          else
            { node, open } = dvl.html.dropdown {
              parent: field
              classStr: dvl.op.iff(readOnly, 'form-dropdown read-only', 'form-dropdown')
              id: uid
              data
              label: dvl.apply(labelFn, (_labelFn) -> (d) -> if d? then _labelFn(d) else defaultLabel)
              selection
              disabled: dvl.op.or(disabled, readOnly)
              editable: true
              onSelect
            }

          return {
            node
            selection
          }

        addRadioField: (label, {selection, classStr, options, labelFn, visible, disabled, disabledFn} = {}) ->
          labelFn or= dvl.identity
          field = makeField(label, null, classStr, visible, disabled)
          selection = dvl.wrapVar(selection)
          disabledFn = dvl.wrap(disabledFn or (-> false))

          myDisabledFn = dvl.op.or(disabled, disabledFn)

          s = dvl.bindSingle {
            parent: field
            self: 'div.radio-options'
            datum: options
          }

          label = dvl.bind {
            parent: s
            self: 'label'
            data: options
            attr: {
              class: dvl.op.iff(myDisabledFn, 'disabled', null)
            }
            on: {
              click: (d) ->
                _myDisabledFn = myDisabledFn.value()
                return if _myDisabledFn?(d)
                onSelect?(d)
                selection.value(d)
                return
            }
          }

          radios = dvl.bind {
            parent: label
            self: 'input'
            attr: {
              type: 'radio'
              disabled: dvl.op.iff(myDisabledFn, '', null)
            }
          }

          dvl.register {
            listen: [radios, selection]
            fn: ->
              _radios = radios.value()
              _selection = selection.value()
              return unless _radios
              _radios.property('checked', (d) -> _selection is d)
              return
          }

          dvl.bind {
            parent: label
            self: 'span'
            text: labelFn
          }

          return {
            node: s.value()
            selection
          }

        addCheckField: (label, {checked, classStr, visible, disabled} = {}) ->
          uid = uniquId()
          field = makeField(null, uid, classStr, visible, disabled)
          checked = dvl.wrapVar(checked)

          checkBox = field.append('input')
            .attr('type', 'checkbox')
            .attr('id', uid)
            .on('change', ->
              isChecked = checkBox.property('checked')
              onChange?(isChecked)
              checked.value(isChecked)
              return
            )

          labelEl = field.append('label')
            .attr('for', uid)
            .text(label)

          dvl.register {
            listen: checked
            fn: ->
              _checked = Boolean(checked.value())
              if _checked isnt checkBox.property('checked')
                checkBox.property('checked', _checked)
              return
          }

          return {
            node: checkBox
            checked
          }

        addListField: (label, {selection, classStr, list, visible, disabled, labelFn} = {}) ->
          field = makeField(label, null, classStr, visible, disabled)
          selection = dvl.wrapVar(selection)
          labelFn ?= String

          dvl.register {
            listen: list
            change: selection
            fn: ->
              _selection = selection.value()
              return unless _selection
              _list = list.value()
              return if _list and _selection in _list
              selection.value(null)
              return
          }

          ul = dvl.bindSingle {
            parent: field
            self: 'ul.list-field'
            attr: {
              class: classStr
            }
          }

          dvl.bind {
            parent: ul
            self: 'li'
            data: list
            attr: {
              class: selection.apply (sel) -> (d) -> if d is sel then 'selected' else null
            }
            text: labelFn
            on: {
              click: (d) ->
                selection.value(d)
                return
            }
          }

          return {
            node: ul.value()
            selection
          }

        addFileField: (label, {file, classStr, visible, disabled, validators} = {}) ->
          validators or= []
          field = makeField(label, null, classStr, visible, disabled)
          fileInput = dvl.wrapVar(fileInput)
          file = dvl.wrapVar(file)
          error = dvl.def()

          uploader = dvl.bindSingle {
            parent: field
            self: 'input'
            attr: {
              type: 'file'
            }
          }

          dvl.bindSingle {
            parent: field
            self: 'div.warning'
            text: error
          }

          uploader.value().on 'change', dvl.group ->
            _file = this.files[0]

            if _file
              for v in validators
                if not v.fn(_file)
                  error.value(v.error)
                  file.value(null)
                  return

            error.value(null)
            file.value(_file)
            return

          dvl.register {
            listen: error
            fn: ->
              field.classed('error', Boolean(error.value()))
              return
          }

          return {
            node: uploader.value()
            file
            error
          }

        addDateField: (label, {date, classStr, visible, disabled, defaultLabel} = {}) ->
          field = makeField(label, null, classStr, visible, disabled)
          date = dvl.wrapVar(date ? new Date())
          defaultLabel or= '--'

          curYear = (new Date()).getUTCFullYear()
          years = (curYear + offset for offset in [-5..5])

          year = date.project {
            down: (_date) -> _date.getUTCFullYear()
            up: (_year) ->
              d = new Date(this)
              d.setUTCFullYear(_year)
              return d
          }

          months = d3.range(12)

          month = date.project {
            down: (_date) -> _date.getUTCMonth()
            up: (_month) ->
              d = new Date(this)
              d.setUTCMonth(_month)
              return d
          }

          days = dvl.apply {
            args: [month, year]
            fn: (_month, _year) ->
              numDays = ((new Date(new Date().setUTCFullYear(_year)).setUTCMonth(_month + 1)) - (new Date(new Date().setUTCFullYear(_year)).setUTCMonth(_month))) / mmx.date.day
              ret = []
              while ret.length < numDays
                ret.push(ret.length + 1)
              return ret
          }

          day = date.project {
            down: (_date) -> _date.getUTCDate()
            up: (_day) ->
              d = new Date(this)
              d.setUTCDate(_day)
              return d
          }

          dropdownCont = field.append('div')
            .attr('class', 'dropdowns')

          monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ]
          dvl.html.dropdown {
            parent: dropdownCont
            classStr: 'form-dropdown month'
            data: months
            label: (d) -> if d? then monthNames[d] else defaultLabel
            selection: month
            editable: true
          }

          dvl.html.dropdown {
            parent: dropdownCont
            classStr: 'form-dropdown day'
            data: days
            label: (d) -> d ? defaultLabel
            selection: day
            editable: true
          }

          dvl.html.dropdown {
            parent: dropdownCont
            classStr: 'form-dropdown year'
            data: years
            label: (d) -> d ? defaultLabel
            selection: year
            editable: true
          }

          return {
            node: dropdownCont
            date
          }
      }
  }
  */

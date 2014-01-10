`
function lift(fn) {
  var fn = arguments[0];
  if ('function' !== typeof fn) throw new TypeError();

  return function(/* args: to fn */) {
    var args = Array.prototype.slice.call(arguments),
        n = args.length,
        i;

    for (i = 0; i < n; i++) {
      if ('function' === typeof args[i]) {
        return function(/* args2 to function wrapper */) {
          var args2 = Array.prototype.slice.call(arguments),
              reduced = [],
              i, v;

          for (i = 0; i < n; i++) {
            v = args[i];
            reduced.push('function' === typeof v ? v.apply(this, args2) : v);
          }

          return fn.apply(null, reduced);
        };
      }
    }

    // Fell through so there are no functions in the arguments to fn -> call it!
    return fn.apply(null, args);
  };
}
`

class PriorityQueue
  constructor: (@key) ->
    @nodes_ = []

  length: ->
    return @nodes_.length

  push: (node) ->
    nodes = @nodes_
    nodes.push(node)
    @moveUp_(nodes.length - 1)
    return this

  shift: ->
    nodes = @nodes_
    count = nodes.length
    rootNode = nodes[0]
    if count <= 0
      return undefined
    else if count is 1
      nodes.pop()
    else
      nodes[0] = nodes.pop()
      @moveDown_(0)

    return rootNode

  moveDown_: (index) ->
    nodes = @nodes_
    key = @key
    count = nodes.length

    # Save the node being moved down.
    node = nodes[index]
    # While the current node has a child.
    while index < (count >> 1)
      leftChildIndex = index * 2 + 1
      rightChildIndex = leftChildIndex + 1 # index * 2 + 2

      # Determine the index of the smaller child.
      smallerChildIndex = if rightChildIndex < count and nodes[rightChildIndex][key] < nodes[leftChildIndex][key] then rightChildIndex else leftChildIndex

      # If the node being moved down is smaller than its children, the node
      # has found the correct index it should be at.
      break if nodes[smallerChildIndex][key] > node[key]

      # If not, then take the smaller child as the current node.
      nodes[index] = nodes[smallerChildIndex]
      index = smallerChildIndex

    nodes[index] = node
    return

  moveUp_: (index) ->
    nodes = @nodes_
    key = @key
    node = nodes[index]

    # While the node being moved up is not at the root.
    while index > 0
      # If the parent is less than the node being moved up, move the parent down.
      parentIndex = (index - 1) >> 1
      if (nodes[parentIndex][key] > node[key])
        nodes[index] = nodes[parentIndex]
        index = parentIndex
      else
        break

    nodes[index] = node
    return


class Set
  constructor: ->
    @map = {}
    @len = 0

  valueOf: -> @map

  length: -> @len

  add: (obj) ->
    if not @map.hasOwnProperty(obj.id)
      @map[obj.id] = obj
      @len++
    return this

  remove: (obj) ->
    if @map.hasOwnProperty(obj.id)
      delete @map[obj.id]
      @len--
    return this


module.exports = {
  PriorityQueue
  Set
}

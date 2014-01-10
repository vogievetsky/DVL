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


module.exports = PriorityQueue


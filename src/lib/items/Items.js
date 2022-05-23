import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Item from './Item'
// import ItemGroup from './ItemGroup'

import { _get, arraysEqual, keyBy } from '../utility/generic'
import {
  getGroupOrders,
  getVisibleItems as getItems,
} from '../utility/calendar'

const canResizeLeft = (item, canResize) => {
  const value =
    _get(item, 'canResize') !== undefined ? _get(item, 'canResize') : canResize
  return value === 'left' || value === 'both'
}

const canResizeRight = (item, canResize) => {
  const value =
    _get(item, 'canResize') !== undefined ? _get(item, 'canResize') : canResize
  return value === 'right' || value === 'both' || value === true
}

function Items(props) {
  function isSelected(item, itemIdKey) {
    if (!props.selected) {
      return props.selectedItem === _get(item, itemIdKey)
    } else {
      let target = _get(item, itemIdKey)
      return props.selected.includes(target)
    }
  }

  function getVisibleItems(canvasTimeStart, canvasTimeEnd) {
    const { keys, items } = props

    return getItems(items, canvasTimeStart, canvasTimeEnd, keys)
  }

  const { canvasTimeStart, canvasTimeEnd, dimensionItems, keys, groups } = props
  const { itemIdKey, itemGroupKey } = keys

  const groupOrders = getGroupOrders(groups, keys)
  const visibleItems = getVisibleItems(
    canvasTimeStart,
    canvasTimeEnd,
    groupOrders
  )
  const sortedDimensionItems = keyBy(dimensionItems, 'id')

  return (
    <div className="rct-items">
      {visibleItems
        .filter((item) => sortedDimensionItems[_get(item, itemIdKey)])
        .map((item) => (
          <Item
            key={_get(item, itemIdKey)}
            item={item}
            keys={props.keys}
            order={groupOrders[_get(item, itemGroupKey)]}
            dimensions={sortedDimensionItems[_get(item, itemIdKey)].dimensions}
            selected={isSelected(item, itemIdKey)}
            canChangeGroup={
              _get(item, 'canChangeGroup') !== undefined
                ? _get(item, 'canChangeGroup')
                : props.canChangeGroup
            }
            canMove={
              _get(item, 'canMove') !== undefined
                ? _get(item, 'canMove')
                : props.canMove
            }
            canResizeLeft={canResizeLeft(item, props.canResize)}
            canResizeRight={canResizeRight(item, props.canResize)}
            canSelect={
              _get(item, 'canSelect') !== undefined
                ? _get(item, 'canSelect')
                : props.canSelect
            }
            useResizeHandle={props.useResizeHandle}
            groupTops={props.groupTops}
            canvasTimeStart={props.canvasTimeStart}
            canvasTimeEnd={props.canvasTimeEnd}
            canvasWidth={props.canvasWidth}
            dragSnap={props.dragSnap}
            minResizeWidth={props.minResizeWidth}
            onResizing={props.itemResizing}
            onResized={props.itemResized}
            moveResizeValidator={props.moveResizeValidator}
            onDrag={props.itemDrag}
            onDrop={props.itemDrop}
            onItemDoubleClick={props.onItemDoubleClick}
            onContextMenu={props.onItemContextMenu}
            onSelect={props.itemSelect}
            itemRenderer={props.itemRenderer}
            scrollRef={props.scrollRef}
          />
        ))}
    </div>
  )
}

Items.propTypes = {
  groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,

  canvasTimeStart: PropTypes.number.isRequired,
  canvasTimeEnd: PropTypes.number.isRequired,
  canvasWidth: PropTypes.number.isRequired,

  dragSnap: PropTypes.number,
  minResizeWidth: PropTypes.number,
  selectedItem: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  canChangeGroup: PropTypes.bool.isRequired,
  canMove: PropTypes.bool.isRequired,
  canResize: PropTypes.oneOf([true, false, 'left', 'right', 'both']),
  canSelect: PropTypes.bool,

  keys: PropTypes.object.isRequired,

  moveResizeValidator: PropTypes.func,
  itemSelect: PropTypes.func,
  itemDrag: PropTypes.func,
  itemDrop: PropTypes.func,
  itemResizing: PropTypes.func,
  itemResized: PropTypes.func,

  onItemDoubleClick: PropTypes.func,
  onItemContextMenu: PropTypes.func,

  itemRenderer: PropTypes.func,
  selected: PropTypes.array,

  dimensionItems: PropTypes.array,
  groupTops: PropTypes.array,
  useResizeHandle: PropTypes.bool,
  scrollRef: PropTypes.object,
}

Items.defaultProps = {
  selected: [],
}

export default Items

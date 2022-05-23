import { useContext, useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import interact from 'interactjs'
import moment from 'moment'

import { _get, deepObjectCompare } from '../utility/generic'
import { composeEvents } from '../utility/events'
import { defaultItemRenderer } from './defaultItemRenderer'
import { coordinateToTimeRatio } from '../utility/calendar'
import { getSumScroll, getSumOffset } from '../utility/dom-helpers'
import {
  overridableStyles,
  selectedStyle,
  selectedAndCanMove,
  selectedAndCanResizeLeft,
  selectedAndCanResizeLeftAndDragLeft,
  selectedAndCanResizeRight,
  selectedAndCanResizeRightAndDragRight,
  leftResizeStyle,
  rightResizeStyle,
} from './styles'
import { TimelineContext } from '../timeline/TimelineContext'
import { usePrevious } from 'react-use'

function Item(props) {
  const [state, setState] = useState({
    interactMounted: false,

    dragging: null,
    dragStart: null,
    preDragPosition: null,
    dragTime: null,
    dragGroupDelta: null,

    resizing: null,
    resizeEdge: null,
    resizeStart: null,
    resizeTime: null,
  })

  const cachedData = useRef({
    itemId: null,
    itemTitle: null,
    itemDivTitle: null,
    itemTimeStart: null,
    itemTimeEnd: null,
  })

  const cacheDataFromProps = () => {
    cachedData.current.itemId = _get(props.item, props.keys.itemIdKey)
    cachedData.current.itemTitle = _get(props.item, props.keys.itemTitleKey)
    cachedData.current.itemDivTitle = props.keys.itemDivTitleKey
      ? _get(props.item, props.keys.itemDivTitleKey)
      : cachedData.current.itemTitle
    cachedData.current.itemTimeStart = _get(
      props.item,
      props.keys.itemTimeStartKey
    )
    cachedData.current.itemTimeEnd = _get(props.item, props.keys.itemTimeEndKey)
  }

  const getTimeRatio = () => {
    const { canvasTimeStart, canvasTimeEnd, canvasWidth } = props
    return coordinateToTimeRatio(canvasTimeStart, canvasTimeEnd, canvasWidth)
  }

  const dragTimeSnap = (dragTime, considerOffset) => {
    const { dragSnap } = props
    if (dragSnap) {
      const offset = considerOffset ? moment().utcOffset() * 60 * 1000 : 0
      return Math.round(dragTime / dragSnap) * dragSnap - (offset % dragSnap)
    } else {
      return dragTime
    }
  }

  const resizeTimeSnap = (dragTime) => {
    const { dragSnap } = props
    if (dragSnap) {
      const endTime = cachedData.current.itemTimeEnd % dragSnap
      return Math.round((dragTime - endTime) / dragSnap) * dragSnap + endTime
    } else {
      return dragTime
    }
  }

  const getDragTime = (e) => {
    const startTime = moment(cachedData.current.itemTimeStart)

    if (state.dragging) {
      return dragTimeSnap(timeFor(e) + state.dragStart.offset, true)
    } else {
      return startTime
    }
  }

  const timeFor = (e) => {
    const ratio = coordinateToTimeRatio(
      props.canvasTimeStart,
      props.canvasTimeEnd,
      props.canvasWidth
    )

    const offset = getSumOffset(props.scrollRef.current).offsetLeft
    const scrolls = getSumScroll(props.scrollRef.current)

    return (
      (e.pageX - offset + scrolls.scrollLeft) * ratio + props.canvasTimeStart
    )
  }

  const getDragGroupDelta = (e) => {
    const { groupTops, order } = props
    if (state.dragging) {
      if (!props.canChangeGroup) {
        return 0
      }
      let groupDelta = 0

      const offset = getSumOffset(props.scrollRef.current).offsetTop
      const scrolls = getSumScroll(props.scrollRef.current)

      for (var key of Object.keys(groupTops)) {
        var groupTop = groupTops[key]
        if (e.pageY - offset + scrolls.scrollTop > groupTop) {
          groupDelta = parseInt(key, 10) - order.index
        } else {
          break
        }
      }

      if (props.order.index + groupDelta < 0) {
        return 0 - props.order.index
      } else {
        return groupDelta
      }
    } else {
      return 0
    }
  }

  const resizeTimeDelta = (e, resizeEdge) => {
    const length =
      cachedData.current.itemTimeEnd - cachedData.current.itemTimeStart
    const timeDelta = dragTimeSnap(
      (e.pageX - state.resizeStart) * getTimeRatio()
    )

    if (
      length + (resizeEdge === 'left' ? -timeDelta : timeDelta) <
      (props.dragSnap || 1000)
    ) {
      if (resizeEdge === 'left') {
        return length - (props.dragSnap || 1000)
      } else {
        return (props.dragSnap || 1000) - length
      }
    } else {
      return timeDelta
    }
  }

  const mountInteract = () => {
    const leftResize = props.useResizeHandle
      ? '.rct-item-handler-resize-left'
      : true
    const rightResize = props.useResizeHandle
      ? '.rct-item-handler-resize-right'
      : true

    interact(itemRef.current)
      .resizable({
        edges: {
          left: canResizeLeft() && leftResize,
          right: canResizeRight() && rightResize,
          top: false,
          bottom: false,
        },
        enabled: props.selected && (canResizeLeft() || canResizeRight()),
      })
      .draggable({
        enabled: props.selected && canMove(),
      })
      .styleCursor(false)
      .on('dragstart', (e) => {
        if (props.selected) {
          const clickTime = timeFor(e)
          setState({
            ...state,
            dragging: true,
            dragStart: {
              x: e.pageX,
              y: e.pageY,
              offset: cachedData.current.itemTimeStart - clickTime,
            },
            preDragPosition: { x: e.target.offsetLeft, y: e.target.offsetTop },
            dragTime: cachedData.current.itemTimeStart,
            dragGroupDelta: 0,
          })
        } else {
          return false
        }
      })
      .on('dragmove', (e) => {
        if (state.dragging) {
          let dragTime = getDragTime(e)
          let dragGroupDelta = getDragGroupDelta(e)
          if (props.moveResizeValidator) {
            dragTime = props.moveResizeValidator('move', props.item, dragTime)
          }

          if (props.onDrag) {
            props.onDrag(
              cachedData.current.itemId,
              dragTime,
              props.order.index + dragGroupDelta
            )
          }

          setState({
            ...state,

            dragTime: dragTime,
            dragGroupDelta: dragGroupDelta,
          })
        }
      })
      .on('dragend', (e) => {
        if (state.dragging) {
          if (props.onDrop) {
            let dragTime = getDragTime(e)

            if (props.moveResizeValidator) {
              dragTime = props.moveResizeValidator('move', props.item, dragTime)
            }

            props.onDrop(
              cachedData.current.itemId,
              dragTime,
              props.order.index + getDragGroupDelta(e)
            )
          }

          setState({
            ...state,

            dragging: false,
            dragStart: null,
            preDragPosition: null,
            dragTime: null,
            dragGroupDelta: null,
          })
        }
      })
      .on('resizestart', (e) => {
        if (props.selected) {
          setState({
            ...state,

            resizing: true,
            resizeEdge: null, // we don't know yet
            resizeStart: e.pageX,
            resizeTime: 0,
          })
        } else {
          return false
        }
      })
      .on('resizemove', (e) => {
        if (state.resizing) {
          let resizeEdge = state.resizeEdge

          if (!resizeEdge) {
            resizeEdge = e.deltaRect.left !== 0 ? 'left' : 'right'
            setState({
              ...state,

              resizeEdge,
            })
          }
          let resizeTime = resizeTimeSnap(timeFor(e))

          if (props.moveResizeValidator) {
            resizeTime = props.moveResizeValidator(
              'resize',
              props.item,
              resizeTime,
              resizeEdge
            )
          }

          if (props.onResizing) {
            props.onResizing(cachedData.current.itemId, resizeTime, resizeEdge)
          }

          setState({
            ...state,

            resizeTime,
          })
        }
      })
      .on('resizeend', (e) => {
        if (state.resizing) {
          const { resizeEdge } = state
          let resizeTime = resizeTimeSnap(timeFor(e))

          if (props.moveResizeValidator) {
            resizeTime = props.moveResizeValidator(
              'resize',
              props.item,
              resizeTime,
              resizeEdge
            )
          }

          if (props.onResized) {
            props.onResized(
              cachedData.current.itemId,
              resizeTime,
              resizeEdge,
              resizeTimeDelta(e, resizeEdge)
            )
          }
          setState({
            ...state,

            resizing: null,
            resizeStart: null,
            resizeEdge: null,
            resizeTime: null,
          })
        }
      })
      .on('tap', (e) => {
        actualClick(e, e.pointerType === 'mouse' ? 'click' : 'touch')
      })

    setState({
      ...state,

      interactMounted: true,
    })
  }

  const canResizeLeft = () => {
    if (!props.canResizeLeft) {
      return false
    }
    let width = parseInt(props.dimensions.width, 10)
    return width >= props.minResizeWidth
  }

  const canResizeRight = () => {
    if (!props.canResizeRight) {
      return false
    }
    let width = parseInt(props.dimensions.width, 10)
    return width >= props.minResizeWidth
  }

  const canMove = () => {
    return !!props.canMove
  }

  useEffect(() => {
    cacheDataFromProps(props)
  }, [])

  const prevProps = usePrevious(props)

  useEffect(() => {
    if (prevProps) {
      cacheDataFromProps(props)

      let { interactMounted } = state
      const couldDrag = prevProps.selected && canMove(prevProps)
      const couldResizeLeft = prevProps.selected && canResizeLeft(prevProps)
      const couldResizeRight = prevProps.selected && canResizeRight(prevProps)
      const willBeAbleToDrag = props.selected && canMove(props)
      const willBeAbleToResizeLeft = props.selected && canResizeLeft(props)
      const willBeAbleToResizeRight = props.selected && canResizeRight(props)

      if (props.selected && !interactMounted) {
        mountInteract()
        interactMounted = true
      }

      if (
        interactMounted &&
        (couldResizeLeft !== willBeAbleToResizeLeft ||
          couldResizeRight !== willBeAbleToResizeRight)
      ) {
        const leftResize = props.useResizeHandle ? dragLeftRef.current : true
        const rightResize = props.useResizeHandle ? dragRightRef.current : true

        interact(itemRef.current).resizable({
          enabled: willBeAbleToResizeLeft || willBeAbleToResizeRight,
          edges: {
            top: false,
            bottom: false,
            left: willBeAbleToResizeLeft && leftResize,
            right: willBeAbleToResizeRight && rightResize,
          },
        })
      }
      if (interactMounted && couldDrag !== willBeAbleToDrag) {
        interact(itemRef.current).draggable({ enabled: willBeAbleToDrag })
      }
    }
  }, [prevProps])

  const startedTouching = useRef(false)
  const startedClicking = useRef(false)

  const onMouseDown = (e) => {
    if (!state.interactMounted) {
      e.preventDefault()
      startedClicking.current = true
    }
  }

  const onMouseUp = (e) => {
    if (!state.interactMounted && startedClicking.current) {
      startedClicking.current = false
      actualClick(e, 'click')
    }
  }

  const onTouchStart = (e) => {
    if (!state.interactMounted) {
      e.preventDefault()
      startedTouching.current = true
    }
  }

  const onTouchEnd = (e) => {
    if (!state.interactMounted && startedTouching.current) {
      startedTouching.current = false
      actualClick(e, 'touch')
    }
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    if (props.onItemDoubleClick) {
      props.onItemDoubleClick(cachedData.current.itemId, e)
    }
  }

  const handleContextMenu = (e) => {
    if (props.onContextMenu) {
      e.preventDefault()
      e.stopPropagation()
      props.onContextMenu(cachedData.current.itemId, e)
    }
  }

  const actualClick = (e, clickType) => {
    if (props.canSelect && props.onSelect) {
      props.onSelect(cachedData.current.itemId, clickType, e)
    }
  }

  const itemRef = useRef(null)
  const dragLeftRef = useRef(null)
  const dragRightRef = useRef(null)

  const getItemProps = (nextProps = {}) => {
    //TODO: maybe shouldnt include all of these classes
    const classNames =
      'rct-item' + (props.item.className ? ` ${props.item.className}` : '')

    return {
      key: cachedData.current.itemId,
      ref: itemRef,
      title: cachedData.current.itemDivTitle,
      className:
        classNames + ` ${nextProps.className ? nextProps.className : ''}`,
      onMouseDown: composeEvents(onMouseDown, nextProps.onMouseDown),
      onMouseUp: composeEvents(onMouseUp, nextProps.onMouseUp),
      onTouchStart: composeEvents(onTouchStart, nextProps.onTouchStart),
      onTouchEnd: composeEvents(onTouchEnd, nextProps.onTouchEnd),
      onDoubleClick: composeEvents(handleDoubleClick, nextProps.onDoubleClick),
      onContextMenu: composeEvents(handleContextMenu, nextProps.onContextMenu),
      style: Object.assign({}, getItemStyle(nextProps)),
    }
  }

  const getResizeProps = (nextProps = {}) => {
    let leftName =
      'rct-item-handler rct-item-handler-left rct-item-handler-resize-left'
    if (nextProps.leftClassName) {
      leftName += ` ${nextProps.leftClassName}`
    }

    let rightName =
      'rct-item-handler rct-item-handler-right rct-item-handler-resize-right'
    if (nextProps.rightClassName) {
      rightName += ` ${nextProps.rightClassName}`
    }
    return {
      left: {
        ref: dragLeftRef,
        className: leftName,
        style: Object.assign({}, leftResizeStyle, nextProps.leftStyle),
      },
      right: {
        ref: dragRightRef,
        className: rightName,
        style: Object.assign({}, rightResizeStyle, nextProps.rightStyle),
      },
    }
  }

  const getItemStyle = (nextProps = {}) => {
    const dimensions = props.dimensions

    const baseStyles = {
      position: 'absolute',
      boxSizing: 'border-box',
      left: `${dimensions.left}px`,
      top: `${dimensions.top}px`,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      lineHeight: `${dimensions.height}px`,
    }

    const finalStyle = Object.assign(
      {},
      overridableStyles,
      props.selected ? selectedStyle : {},
      props.selected & canMove(props) ? selectedAndCanMove : {},
      props.selected & canResizeLeft(props) ? selectedAndCanResizeLeft : {},
      props.selected & canResizeLeft(props) & state.dragging
        ? selectedAndCanResizeLeftAndDragLeft
        : {},
      props.selected & canResizeRight(props) ? selectedAndCanResizeRight : {},
      props.selected & canResizeRight(props) & state.dragging
        ? selectedAndCanResizeRightAndDragRight
        : {},
      nextProps.style,
      baseStyles
    )
    return finalStyle
  }

  if (typeof props.order === 'undefined' || props.order === null) {
    return null
  }

  const timelineContext = useContext(TimelineContext)

  const itemContext = {
    dimensions: props.dimensions,
    useResizeHandle: props.useResizeHandle,
    title: cachedData.current.itemTitle,
    canMove: canMove(props),
    canResizeLeft: canResizeLeft(props),
    canResizeRight: canResizeRight(props),
    selected: props.selected,
    dragging: state.dragging,
    dragStart: state.dragStart,
    dragTime: state.dragTime,
    dragGroupDelta: state.dragGroupDelta,
    resizing: state.resizing,
    resizeEdge: state.resizeEdge,
    resizeStart: state.resizeStart,
    resizeTime: state.resizeTime,
    width: props.dimensions.width,
  }

  return props.itemRenderer({
    item: props.item,
    timelineContext,
    itemContext,
    getItemProps: getItemProps,
    getResizeProps: getResizeProps,
  })
}

Item.propTypes = {
  canvasTimeStart: PropTypes.number.isRequired,
  canvasTimeEnd: PropTypes.number.isRequired,
  canvasWidth: PropTypes.number.isRequired,
  order: PropTypes.object,

  dragSnap: PropTypes.number,
  minResizeWidth: PropTypes.number,
  selected: PropTypes.bool,

  canChangeGroup: PropTypes.bool.isRequired,
  canMove: PropTypes.bool.isRequired,
  canResizeLeft: PropTypes.bool.isRequired,
  canResizeRight: PropTypes.bool.isRequired,

  keys: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,

  onSelect: PropTypes.func,
  onDrag: PropTypes.func,
  onDrop: PropTypes.func,
  onResizing: PropTypes.func,
  onResized: PropTypes.func,
  onContextMenu: PropTypes.func,
  itemRenderer: PropTypes.func,

  itemProps: PropTypes.object,
  canSelect: PropTypes.bool,
  dimensions: PropTypes.object,
  groupTops: PropTypes.array,
  useResizeHandle: PropTypes.bool,
  moveResizeValidator: PropTypes.func,
  onItemDoubleClick: PropTypes.func,

  scrollRef: PropTypes.object,
}

Item.defaultProps = {
  selected: false,
  itemRenderer: defaultItemRenderer,
}

export default Item

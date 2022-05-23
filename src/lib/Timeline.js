import PropTypes from 'prop-types'
import React, { useState, useEffect, useRef } from 'react'
import { usePrevious } from 'react-use'

import moment from 'moment'

import Items from './items/Items'
import Sidebar from './layout/Sidebar'
import Columns from './columns/Columns'
import GroupRows from './row/GroupRows'
import ScrollElement from './scroll/ScrollElement'
import MarkerCanvas from './markers/MarkerCanvas'
import windowResizeDetector from '../resize-detector/window'
import { debounce, throttle } from 'lodash-es'

import {
  getMinUnit,
  getNextUnit,
  calculateTimeForXPosition,
  calculateScrollCanvas,
  getCanvasBoundariesFromVisibleTime,
  getCanvasWidth,
  stackTimelineItems,
} from './utility/calendar'
import { _get, _length } from './utility/generic'
import {
  defaultKeys,
  defaultTimeSteps,
  defaultHeaderLabelFormats,
  defaultSubHeaderLabelFormats,
} from './default-config'
import { TimelineStateProvider } from './timeline/TimelineStateContext'
import { TimelineMarkersProvider } from './markers/TimelineMarkersContext'
import { TimelineHeadersProvider } from './headers/HeadersContext'
import TimelineHeaders from './headers/TimelineHeaders'
import DateHeader from './headers/DateHeader'
import SidebarHeader from './headers/SidebarHeader'

import { TimelineContext } from './timeline/TimelineContext'

function ReactCalendarTimeline(props) {
  const [state, setState] = useState(() => {
    let visibleTimeStart = null
    let visibleTimeEnd = null

    if (props.defaultTimeStart && props.defaultTimeEnd) {
      visibleTimeStart = props.defaultTimeStart.valueOf()
      visibleTimeEnd = props.defaultTimeEnd.valueOf()
    } else if (props.visibleTimeStart && props.visibleTimeEnd) {
      visibleTimeStart = props.visibleTimeStart
      visibleTimeEnd = props.visibleTimeEnd
    } else {
      //throwing an error because neither default or visible time props provided
      throw new Error(
        'You must provide either "defaultTimeStart" and "defaultTimeEnd" or "visibleTimeStart" and "visibleTimeEnd" to initialize the Timeline'
      )
    }

    const [canvasTimeStart, canvasTimeEnd] = getCanvasBoundariesFromVisibleTime(
      visibleTimeStart,
      visibleTimeEnd
    )

    const initialState = {
      width: 1000,
      visibleTimeStart,
      visibleTimeEnd,
      canvasTimeStart,
      canvasTimeEnd,
      selectedItem: null,
      dragTime: null,
      dragGroupTitle: null,
      resizeTime: null,
      resizingItem: null,
      resizingEdge: null,

      dimensionItems: null,
      height: null,
      groupHeights: null,
      groupTops: null,
    }

    const canvasWidth = getCanvasWidth(initialState.width)

    return {
      ...initialState,
      ...stackTimelineItems(
        props.items,
        props.groups,
        canvasWidth,
        initialState.canvasTimeStart,
        initialState.canvasTimeEnd,
        props.keys,
        props.lineHeight,
        props.itemHeightRatio,
        props.stackItems,
        initialState.draggingItem,
        initialState.resizingItem,
        initialState.dragTime,
        initialState.resizingEdge,
        initialState.resizeTime,
        initialState.newGroupOrder
      ),
    }
  })

  const prevState = usePrevious(state)

  const timelineRef = useRef(null)

  const getTimelineContext = () => {
    const {
      width,
      visibleTimeStart,
      visibleTimeEnd,
      canvasTimeStart,
      canvasTimeEnd,
    } = state

    return {
      timelineWidth: width,
      visibleTimeStart,
      visibleTimeEnd,
      canvasTimeStart,
      canvasTimeEnd,
    }
  }

  const containerRef = useRef(null)

  const resize = () => {
    const { width: containerWidth } =
      containerRef.current.getBoundingClientRect()

    let width = containerWidth - props.sidebarWidth - props.rightSidebarWidth
    const canvasWidth = getCanvasWidth(width)
    const { dimensionItems, height, groupHeights, groupTops } =
      stackTimelineItems(
        props.items,
        props.groups,
        canvasWidth,
        state.canvasTimeStart,
        state.canvasTimeEnd,
        props.keys,
        props.lineHeight,
        props.itemHeightRatio,
        props.stackItems,
        state.draggingItem,
        state.resizingItem,
        state.dragTime,
        state.resizingEdge,
        state.resizeTime,
        state.newGroupOrder
      )

    // this is needed by dragItem since it uses pageY from the drag events
    // if this was in the context of the scrollElement, this would not be necessary

    setState({
      ...state,
      width,
      dimensionItems,
      height,
      groupHeights,
      groupTops,
    })

    scrollComponentRef.current.scrollLeft = width
    scrollHeaderRef.current.scrollLeft = width
  }

  // called when the visible time changes
  const updateScrollCanvas = (
    visibleTimeStart,
    visibleTimeEnd,
    forceUpdateDimensions,
    items = props.items,
    groups = props.groups
  ) => {
    const newState = calculateScrollCanvas(
      visibleTimeStart,
      visibleTimeEnd,
      forceUpdateDimensions,
      items,
      groups,
      props,
      state
    )

    setState(newState)
  }

  const onScroll = (scrollX) => {
    console.log(scrollX)
    const width = state.width

    const canvasTimeStart = state.canvasTimeStart

    const zoom = state.visibleTimeEnd - state.visibleTimeStart

    const visibleTimeStart = canvasTimeStart + (zoom * scrollX) / width

    if (
      state.visibleTimeStart !== visibleTimeStart ||
      state.visibleTimeEnd !== visibleTimeStart + zoom
    ) {
      props.onTimeChange(
        visibleTimeStart,
        visibleTimeStart + zoom,
        updateScrollCanvas
      )
    }
  }

  const handleWheelZoom = (speed, xPosition, deltaY) => {
    changeZoom(1.0 + (speed * deltaY) / 500, xPosition / state.width)
  }

  const changeZoom = (scale, offset = 0.5) => {
    const { minZoom, maxZoom } = props
    const oldZoom = state.visibleTimeEnd - state.visibleTimeStart
    const newZoom = Math.min(
      Math.max(Math.round(oldZoom * scale), minZoom),
      maxZoom
    ) // min 1 min, max 20 years
    const newVisibleTimeStart = Math.round(
      state.visibleTimeStart + (oldZoom - newZoom) * offset
    )

    props.onTimeChange(
      newVisibleTimeStart,
      newVisibleTimeStart + newZoom,
      updateScrollCanvas
    )
  }

  const showPeriod = (from, to) => {
    let visibleTimeStart = from.valueOf()
    let visibleTimeEnd = to.valueOf()

    let zoom = visibleTimeEnd - visibleTimeStart
    // can't zoom in more than to show one hour
    if (zoom < props.minZoom) {
      return
    }

    props.onTimeChange(
      visibleTimeStart,
      visibleTimeStart + zoom,
      updateScrollCanvas
    )
  }

  const selectItem = (item, clickType, e) => {
    if (
      isItemSelected(item) ||
      (props.itemTouchSendsClick && clickType === 'touch')
    ) {
      if (item && props.onItemClick) {
        const time = timeFromItemEvent(e)
        props.onItemClick(item, e, time)
      }
    } else {
      setState({
        ...state,
        selectedItem: item,
      })
      if (item && props.onItemSelect) {
        const time = timeFromItemEvent(e)
        props.onItemSelect(item, e, time)
      } else if (item === null && props.onItemDeselect) {
        props.onItemDeselect(e) // this isnt in the docs. Is this function even used?
      }
    }
  }

  const doubleClickItem = (item, e) => {
    if (props.onItemDoubleClick) {
      const time = timeFromItemEvent(e)
      props.onItemDoubleClick(item, e, time)
    }
  }

  const contextMenuClickItem = (item, e) => {
    if (props.onItemContextMenu) {
      const time = timeFromItemEvent(e)
      props.onItemContextMenu(item, e, time)
    }
  }

  // TODO: this is very similar to timeFromItemEvent, aside from which element to get offsets
  // from.  Look to consolidate the logic for determining coordinate to time
  // as well as generalizing how we get time from click on the canvas
  const getTimeFromRowClickEvent = (e) => {
    const { dragSnap } = props
    const { width, canvasTimeStart, canvasTimeEnd } = state
    // this gives us distance from left of row element, so event is in
    // context of the row element, not client or page
    const { offsetX } = e.nativeEvent

    let time = calculateTimeForXPosition(
      canvasTimeStart,

      canvasTimeEnd,
      getCanvasWidth(width),
      offsetX
    )
    time = Math.floor(time / dragSnap) * dragSnap

    return time
  }

  const timeFromItemEvent = (e) => {
    const { width, visibleTimeStart, visibleTimeEnd } = state
    const { dragSnap } = props

    // TODO:
    const { left: scrollX } = scrollComponentRef.current.getBoundingClientRect()

    const xRelativeToTimeline = e.clientX - scrollX

    const relativeItemPosition = xRelativeToTimeline / width
    const zoom = visibleTimeEnd - visibleTimeStart
    const timeOffset = relativeItemPosition * zoom

    let time = Math.round(visibleTimeStart + timeOffset)
    time = Math.floor(time / dragSnap) * dragSnap

    return time
  }

  const dragItem = (item, dragTime, newGroupOrder) => {
    let newGroup = props.groups[newGroupOrder]
    const keys = props.keys

    setState({
      ...state,
      draggingItem: item,
      dragTime: dragTime,
      newGroupOrder: newGroupOrder,
      dragGroupTitle: newGroup ? _get(newGroup, keys.groupLabelKey) : '',
    })

    updatingItem({
      eventType: 'move',
      itemId: item,
      time: dragTime,
      newGroupOrder,
    })
  }

  const dropItem = (item, dragTime, newGroupOrder) => {
    setState({
      ...state,
      draggingItem: null,
      dragTime: null,
      dragGroupTitle: null,
    })
    if (props.onItemMove) {
      props.onItemMove(item, dragTime, newGroupOrder)
    }
  }

  const resizingItem = (item, resizeTime, edge) => {
    setState({
      ...state,
      resizingItem: item,
      resizingEdge: edge,
      resizeTime: resizeTime,
    })

    updatingItem({
      eventType: 'resize',
      itemId: item,
      time: resizeTime,
      edge,
    })
  }

  const resizedItem = (item, resizeTime, edge, timeDelta) => {
    setState({
      ...state,
      resizingItem: null,
      resizingEdge: null,
      resizeTime: null,
    })
    if (props.onItemResize && timeDelta !== 0) {
      props.onItemResize(item, resizeTime, edge)
    }
  }

  const updatingItem = ({ eventType, itemId, time, edge, newGroupOrder }) => {
    if (props.onItemDrag) {
      props.onItemDrag({ eventType, itemId, time, edge, newGroupOrder })
    }
  }

  const columns = (
    canvasTimeStart,
    canvasTimeEnd,
    canvasWidth,
    minUnit,
    timeSteps,
    height
  ) => {
    return (
      <Columns
        canvasTimeStart={canvasTimeStart}
        canvasTimeEnd={canvasTimeEnd}
        canvasWidth={canvasWidth}
        lineCount={_length(props.groups)}
        minUnit={minUnit}
        timeSteps={timeSteps}
        height={height}
        verticalLineClassNamesForTime={props.verticalLineClassNamesForTime}
      />
    )
  }

  const handleRowClick = (e, rowIndex) => {
    // shouldnt this be handled by the user, as far as when to deselect an item?
    if (hasSelectedItem()) {
      selectItem(null)
    }

    if (props.onCanvasClick == null) return

    const time = getTimeFromRowClickEvent(e)
    const groupId = _get(props.groups[rowIndex], props.keys.groupIdKey)
    props.onCanvasClick(groupId, time, e)
  }

  const handleRowDoubleClick = (e, rowIndex) => {
    if (props.onCanvasDoubleClick == null) return

    const time = getTimeFromRowClickEvent(e)
    const groupId = _get(props.groups[rowIndex], props.keys.groupIdKey)
    props.onCanvasDoubleClick(groupId, time, e)
  }

  const handleScrollContextMenu = (e, rowIndex) => {
    if (props.onCanvasContextMenu == null) return

    const timePosition = getTimeFromRowClickEvent(e)

    const groupId = _get(props.groups[rowIndex], props.keys.groupIdKey)

    if (props.onCanvasContextMenu) {
      e.preventDefault()
      props.onCanvasContextMenu(groupId, timePosition, e)
    }
  }

  const rows = (canvasWidth, groupHeights, groups) => {
    return (
      <GroupRows
        groups={groups}
        canvasWidth={canvasWidth}
        lineCount={_length(props.groups)}
        groupHeights={groupHeights}
        clickTolerance={props.clickTolerance}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
        horizontalLineClassNamesForGroup={
          props.horizontalLineClassNamesForGroup
        }
        onRowContextClick={handleScrollContextMenu}
      />
    )
  }

  const items = (
    canvasTimeStart,
    zoom,
    canvasTimeEnd,
    canvasWidth,
    minUnit,
    dimensionItems,
    groupHeights,
    groupTops
  ) => {
    return (
      <Items
        canvasTimeStart={canvasTimeStart}
        canvasTimeEnd={canvasTimeEnd}
        canvasWidth={canvasWidth}
        dimensionItems={dimensionItems}
        groupTops={groupTops}
        items={props.items}
        groups={props.groups}
        keys={props.keys}
        selectedItem={state.selectedItem}
        dragSnap={props.dragSnap}
        minResizeWidth={props.minResizeWidth}
        canChangeGroup={props.canChangeGroup}
        canMove={props.canMove}
        canResize={props.canResize}
        useResizeHandle={props.useResizeHandle}
        canSelect={props.canSelect}
        moveResizeValidator={props.moveResizeValidator}
        itemSelect={selectItem}
        itemDrag={dragItem}
        itemDrop={dropItem}
        onItemDoubleClick={doubleClickItem}
        onItemContextMenu={contextMenuClickItem}
        itemResizing={resizingItem}
        itemResized={resizedItem}
        itemRenderer={props.itemRenderer}
        selected={props.selected}
        scrollRef={scrollComponentRef}
      />
    )
  }

  const scrollHeaderRef = useRef(null)

  const handleHeaderRef = (el) => {
    scrollHeaderRef.current = el
    props.headerRef(el)
  }

  const sidebar = (height, groupHeights) => {
    const { sidebarWidth } = props
    return (
      sidebarWidth && (
        <Sidebar
          groups={props.groups}
          groupRenderer={props.groupRenderer}
          keys={props.keys}
          width={sidebarWidth}
          groupHeights={groupHeights}
          height={height}
        />
      )
    )
  }

  const rightSidebar = (height, groupHeights) => {
    const { rightSidebarWidth } = props
    return (
      rightSidebarWidth && (
        <Sidebar
          groups={props.groups}
          keys={props.keys}
          groupRenderer={props.groupRenderer}
          isRightSidebar
          width={rightSidebarWidth}
          groupHeights={groupHeights}
          height={height}
        />
      )
    )
  }

  /**
   * check if child of type TimelineHeader
   * refer to for explanation https://github.com/gaearon/react-hot-loader#checking-element-types
   */
  const isTimelineHeader = (child) => {
    if (child.type === undefined) return false
    return child.type.secretKey === TimelineHeaders.secretKey
  }

  const childrenWithProps = (
    canvasTimeStart,
    canvasTimeEnd,
    canvasWidth,
    dimensionItems,
    groupHeights,
    groupTops,
    height,
    visibleTimeStart,
    visibleTimeEnd,
    minUnit,
    timeSteps
  ) => {
    if (!props.children) {
      return null
    }

    // convert to an array and remove the nulls
    const childArray = Array.isArray(props.children)
      ? props.children.filter((c) => c)
      : [props.children]

    const childProps = {
      canvasTimeStart,
      canvasTimeEnd,
      canvasWidth,
      visibleTimeStart: visibleTimeStart,
      visibleTimeEnd: visibleTimeEnd,
      dimensionItems,
      items: props.items,
      groups: props.groups,
      keys: props.keys,
      groupHeights: groupHeights,
      groupTops: groupTops,
      selected: getSelected(),
      height: height,
      minUnit: minUnit,
      timeSteps: timeSteps,
    }

    return React.Children.map(childArray, (child) => {
      if (!isTimelineHeader(child)) {
        return React.cloneElement(child, childProps)
      } else {
        return null
      }
    })
  }

  const renderHeaders = () => {
    if (props.children) {
      let headerRenderer
      React.Children.map(props.children, (child) => {
        if (isTimelineHeader(child)) {
          headerRenderer = child
        }
      })
      if (headerRenderer) {
        return headerRenderer
      }
    }
    return (
      <TimelineHeaders>
        <DateHeader unit="primaryHeader" />
        <DateHeader />
      </TimelineHeaders>
    )
  }

  const getSelected = () => {
    return state.selectedItem && !props.selected
      ? [state.selectedItem]
      : props.selected || []
  }

  const hasSelectedItem = () => {
    if (!Array.isArray(props.selected)) return !!state.selectedItem
    return props.selected.length > 0
  }

  const isItemSelected = (itemId) => {
    const selectedItems = getSelected()
    return selectedItems.some((i) => i === itemId)
  }

  const scrollComponentRef = useRef(null)

  const scrollRef = (el) => {
    props.scrollRef(el)
    scrollComponentRef.current = el
  }

  useEffect(() => {
    // resize()
    // if (props.resizeDetector && props.resizeDetector.addListener) {
    //   props.resizeDetector.addListener(timelineRef.current)
    // }
    // windowResizeDetector.addListener(timelineRef.current)
    // return () => {
    //   if (props.resizeDetector && props.resizeDetector.addListener) {
    //     props.resizeDetector.removeListener(timelineRef.current)
    //   }
    //   windowResizeDetector.removeListener(timelineRef.current)
    // }

    // 监听resize
    window.addEventListener('resize', throttle(resize, 100))
    return () => {
      window.removeEventListener('resize', throttle(resize, 100))
    }
  }, [])

  useEffect(() => {
    if (prevState) {
      const newZoom = state.visibleTimeEnd - state.visibleTimeStart
      const oldZoom = prevState.visibleTimeEnd - prevState.visibleTimeStart

      // are we changing zoom? Report it!
      if (props.onZoom && newZoom !== oldZoom) {
        props.onZoom(getTimelineContext())
      }

      // The bounds have changed? Report it!
      if (
        props.onBoundsChange &&
        state.canvasTimeStart !== prevState.canvasTimeStart
      ) {
        props.onBoundsChange(
          state.canvasTimeStart,
          state.canvasTimeStart + newZoom * 3
        )
      }

      // Check the scroll is correct
      const scrollLeft = Math.round(
        (state.width * (state.visibleTimeStart - state.canvasTimeStart)) /
          newZoom
      )
      const componentScrollLeft = Math.round(
        (prevState.width *
          (prevState.visibleTimeStart - prevState.canvasTimeStart)) /
          oldZoom
      )
      if (componentScrollLeft !== scrollLeft) {
        scrollComponentRef.current.scrollLeft = scrollLeft
        scrollHeaderRef.current.scrollLeft = scrollLeft
      }
    }
  })

  const deriveState = (nextProps, prevState) => {
    const { visibleTimeStart, visibleTimeEnd, items, groups } = nextProps

    // This is a gross hack pushing items and groups in to state only to allow
    // For the forceUpdate check
    let derivedState = { items, groups }

    // if the items or groups have changed we must re-render
    const forceUpdate = items !== prevState.items || groups !== prevState.groups

    // We are a controlled component
    if (visibleTimeStart && visibleTimeEnd) {
      // Get the new canvas position
      Object.assign(
        derivedState,
        calculateScrollCanvas(
          visibleTimeStart,
          visibleTimeEnd,
          forceUpdate,
          items,
          groups,
          nextProps,
          prevState
        )
      )
    } else if (forceUpdate) {
      // Calculate new item stack position as canvas may have changed
      const canvasWidth = getCanvasWidth(prevState.width)
      Object.assign(
        derivedState,
        stackTimelineItems(
          items,
          groups,
          canvasWidth,
          prevState.canvasTimeStart,
          prevState.canvasTimeEnd,
          nextProps.keys,
          nextProps.lineHeight,
          nextProps.itemHeightRatio,
          nextProps.stackItems,
          prevState.draggingItem,
          prevState.resizingItem,
          prevState.dragTime,
          prevState.resizingEdge,
          prevState.resizeTime,
          prevState.newGroupOrder
        )
      )
    }

    return derivedState
  }

  const zoom = state.visibleTimeEnd - state.visibleTimeStart
  const canvasWidth = getCanvasWidth(state.width)
  const minUnit = getMinUnit(zoom, state.width, props.timeSteps)

  const isInteractingWithItem = !!state.draggingItem || !!state.resizingItem

  if (isInteractingWithItem) {
    const stackResults = stackTimelineItems(
      state.items,
      state.groups,
      canvasWidth,
      state.canvasTimeStart,
      state.canvasTimeEnd,
      props.keys,
      props.lineHeight,
      props.itemHeightRatio,
      props.stackItems,
      state.draggingItem,
      state.resizingItem,
      state.dragTime,
      state.resizingEdge,
      state.resizeTime,
      state.newGroupOrder
    )
    state.dimensionItems = stackResults.dimensionItems
    state.height = stackResults.height
    state.groupHeights = stackResults.groupHeights
    state.groupTops = stackResults.groupTops
  }

  const outerComponentStyle = {
    height: `${state.height}px`,
  }

  return (
    <TimelineContext.Provider value={getTimelineContext()}>
      <TimelineStateProvider
        visibleTimeStart={state.visibleTimeStart}
        visibleTimeEnd={state.visibleTimeEnd}
        canvasTimeStart={state.canvasTimeStart}
        canvasTimeEnd={state.canvasTimeEnd}
        canvasWidth={canvasWidth}
        showPeriod={showPeriod}
        timelineUnit={minUnit}
        timelineWidth={state.width}
      >
        <TimelineMarkersProvider>
          <TimelineHeadersProvider
            registerScroll={handleHeaderRef}
            timeSteps={props.timeSteps}
            leftSidebarWidth={props.sidebarWidth}
            rightSidebarWidth={props.rightSidebarWidth}
          >
            <div
              style={props.style}
              ref={containerRef}
              className={`react-calendar-timeline ${props.className}`}
            >
              {renderHeaders()}
              <div style={outerComponentStyle} className="rct-outer">
                {props.sidebarWidth > 0
                  ? sidebar(state.height, state.groupHeights)
                  : null}
                <ScrollElement
                  scrollRef={scrollRef}
                  width={state.width}
                  height={state.height}
                  onZoom={changeZoom}
                  onWheelZoom={handleWheelZoom}
                  traditionalZoom={props.traditionalZoom}
                  onScroll={throttle(onScroll, 100)}
                  isInteractingWithItem={isInteractingWithItem}
                >
                  <MarkerCanvas>
                    {columns(
                      state.canvasTimeStart,
                      state.canvasTimeEnd,
                      canvasWidth,
                      minUnit,
                      props.timeSteps,
                      state.height
                    )}
                    {rows(canvasWidth, state.groupHeights, props.groups)}
                    {items(
                      state.canvasTimeStart,
                      zoom,
                      state.canvasTimeEnd,
                      canvasWidth,
                      minUnit,
                      state.dimensionItems,
                      state.groupHeights,
                      state.groupTops
                    )}
                    {childrenWithProps(
                      state.canvasTimeStart,
                      state.canvasTimeEnd,
                      canvasWidth,
                      state.dimensionItems,
                      state.groupHeights,
                      state.groupTops,
                      state.height,
                      state.visibleTimeStart,
                      state.visibleTimeEnd,
                      minUnit,
                      props.timeSteps
                    )}
                  </MarkerCanvas>
                </ScrollElement>
                {props.rightSidebarWidth > 0
                  ? rightSidebar(state.height, state.groupHeights)
                  : null}
              </div>
            </div>
          </TimelineHeadersProvider>
        </TimelineMarkersProvider>
      </TimelineStateProvider>
    </TimelineContext.Provider>
  )
}

ReactCalendarTimeline.propTypes = {
  groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  sidebarWidth: PropTypes.number,
  rightSidebarWidth: PropTypes.number,
  dragSnap: PropTypes.number,
  minResizeWidth: PropTypes.number,
  stickyHeader: PropTypes.bool,
  lineHeight: PropTypes.number,
  itemHeightRatio: PropTypes.number,

  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,

  clickTolerance: PropTypes.number,

  canChangeGroup: PropTypes.bool,
  canMove: PropTypes.bool,
  canResize: PropTypes.oneOf([true, false, 'left', 'right', 'both']),
  useResizeHandle: PropTypes.bool,
  canSelect: PropTypes.bool,

  stackItems: PropTypes.bool,

  traditionalZoom: PropTypes.bool,

  itemTouchSendsClick: PropTypes.bool,

  horizontalLineClassNamesForGroup: PropTypes.func,

  onItemMove: PropTypes.func,
  onItemResize: PropTypes.func,
  onItemClick: PropTypes.func,
  onItemSelect: PropTypes.func,
  onItemDeselect: PropTypes.func,
  onCanvasClick: PropTypes.func,
  onItemDoubleClick: PropTypes.func,
  onItemContextMenu: PropTypes.func,
  onCanvasDoubleClick: PropTypes.func,
  onCanvasContextMenu: PropTypes.func,
  onZoom: PropTypes.func,
  onItemDrag: PropTypes.func,

  moveResizeValidator: PropTypes.func,

  itemRenderer: PropTypes.func,
  groupRenderer: PropTypes.func,

  className: PropTypes.string,
  style: PropTypes.object,

  keys: PropTypes.shape({
    groupIdKey: PropTypes.string,
    groupTitleKey: PropTypes.string,
    groupLabelKey: PropTypes.string,
    groupRightTitleKey: PropTypes.string,
    itemIdKey: PropTypes.string,
    itemTitleKey: PropTypes.string,
    itemDivTitleKey: PropTypes.string,
    itemGroupKey: PropTypes.string,
    itemTimeStartKey: PropTypes.string,
    itemTimeEndKey: PropTypes.string,
  }),
  headerRef: PropTypes.func,
  scrollRef: PropTypes.func,

  timeSteps: PropTypes.shape({
    second: PropTypes.number,
    minute: PropTypes.number,
    hour: PropTypes.number,
    day: PropTypes.number,
    month: PropTypes.number,
    year: PropTypes.number,
  }),

  defaultTimeStart: PropTypes.object,
  defaultTimeEnd: PropTypes.object,

  visibleTimeStart: PropTypes.number,
  visibleTimeEnd: PropTypes.number,
  onTimeChange: PropTypes.func,
  onBoundsChange: PropTypes.func,

  selected: PropTypes.array,

  headerLabelFormats: PropTypes.shape({
    yearShort: PropTypes.string,
    yearLong: PropTypes.string,
    monthShort: PropTypes.string,
    monthMedium: PropTypes.string,
    monthMediumLong: PropTypes.string,
    monthLong: PropTypes.string,
    dayShort: PropTypes.string,
    dayLong: PropTypes.string,
    hourShort: PropTypes.string,
    hourMedium: PropTypes.string,
    hourMediumLong: PropTypes.string,
    hourLong: PropTypes.string,
  }),

  subHeaderLabelFormats: PropTypes.shape({
    yearShort: PropTypes.string,
    yearLong: PropTypes.string,
    monthShort: PropTypes.string,
    monthMedium: PropTypes.string,
    monthLong: PropTypes.string,
    dayShort: PropTypes.string,
    dayMedium: PropTypes.string,
    dayMediumLong: PropTypes.string,
    dayLong: PropTypes.string,
    hourShort: PropTypes.string,
    hourLong: PropTypes.string,
    minuteShort: PropTypes.string,
    minuteLong: PropTypes.string,
  }),

  resizeDetector: PropTypes.shape({
    addListener: PropTypes.func,
    removeListener: PropTypes.func,
  }),

  verticalLineClassNamesForTime: PropTypes.func,

  children: PropTypes.node,
}

ReactCalendarTimeline.defaultProps = {
  sidebarWidth: 150,
  rightSidebarWidth: 0,
  dragSnap: 1000 * 60 * 15, // 15min
  minResizeWidth: 20,
  stickyHeader: true,
  lineHeight: 30,
  itemHeightRatio: 0.65,

  minZoom: 60 * 60 * 1000, // 1 hour
  maxZoom: 5 * 365.24 * 86400 * 1000, // 5 years

  clickTolerance: 3, // how many pixels can we drag for it to be still considered a click?

  canChangeGroup: true,
  canMove: true,
  canResize: 'right',
  useResizeHandle: false,
  canSelect: true,

  stackItems: false,

  traditionalZoom: false,

  horizontalLineClassNamesForGroup: null,

  onItemMove: null,
  onItemResize: null,
  onItemClick: null,
  onItemSelect: null,
  onItemDeselect: null,
  onItemDrag: null,
  onCanvasClick: null,
  onItemDoubleClick: null,
  onItemContextMenu: null,
  onZoom: null,

  verticalLineClassNamesForTime: null,

  moveResizeValidator: null,

  dayBackground: null,

  defaultTimeStart: null,
  defaultTimeEnd: null,

  itemTouchSendsClick: false,

  style: {},
  className: '',
  keys: defaultKeys,
  timeSteps: defaultTimeSteps,
  headerRef: () => {},
  scrollRef: () => {},

  // if you pass in visibleTimeStart and visibleTimeEnd, you must also pass onTimeChange(visibleTimeStart, visibleTimeEnd),
  // which needs to update the props visibleTimeStart and visibleTimeEnd to the ones passed
  visibleTimeStart: null,
  visibleTimeEnd: null,
  onTimeChange: function (
    visibleTimeStart,
    visibleTimeEnd,
    updateScrollCanvas
  ) {
    updateScrollCanvas(visibleTimeStart, visibleTimeEnd)
  },
  // called when the canvas area of the calendar changes
  onBoundsChange: null,
  children: null,

  headerLabelFormats: defaultHeaderLabelFormats,
  subHeaderLabelFormats: defaultSubHeaderLabelFormats,

  selected: null,
}

export default ReactCalendarTimeline

/* eslint-disable no-console */
import React, { useState } from 'react'
import moment from 'moment'

import Timeline, {
  TimelineMarkers,
  TimelineHeaders,
  TodayMarker,
  CustomMarker,
  CursorMarker,
  CustomHeader,
  SidebarHeader,
  DateHeader,
} from 'react-calendar-timeline'

import generateFakeData from '../generate-fake-data'

var minTime = moment().add(-6, 'months').valueOf()
var maxTime = moment().add(6, 'months').valueOf()

var keys = {
  groupIdKey: 'id',
  groupTitleKey: 'title',
  groupRightTitleKey: 'rightTitle',
  itemIdKey: 'id',
  itemTitleKey: 'title',
  itemDivTitleKey: 'title',
  itemGroupKey: 'group',
  itemTimeStartKey: 'start',
  itemTimeEndKey: 'end',
}

function App() {
  const fakeData = generateFakeData()
  const defaultTimeStart = moment().startOf('day').toDate()
  const defaultTimeEnd = moment().startOf('day').add(1, 'day').toDate()
  const [groups, setGroups] = useState(fakeData.groups)
  const [items, setItems] = useState(fakeData.items)

  const handleCanvasClick = (groupId, time) => {
    console.log('Canvas clicked', groupId, moment(time).format())
  }

  const handleCanvasDoubleClick = (groupId, time) => {
    console.log('Canvas double clicked', groupId, moment(time).format())
  }

  const handleCanvasContextMenu = (group, time) => {
    console.log('Canvas context menu', group, moment(time).format())
  }

  const handleItemClick = (itemId, _, time) => {
    console.log('Clicked: ' + itemId, moment(time).format())
  }

  const handleItemSelect = (itemId, _, time) => {
    console.log('Selected: ' + itemId, moment(time).format())
  }

  const handleItemDoubleClick = (itemId, _, time) => {
    console.log('Double Click: ' + itemId, moment(time).format())
  }

  const handleItemContextMenu = (itemId, _, time) => {
    console.log('Context Menu: ' + itemId, moment(time).format())
  }

  const handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const group = groups[newGroupOrder]

    const arr = items.map((item) =>
      item.id === itemId
        ? Object.assign({}, item, {
            start: dragTime,
            end: dragTime + (item.end - item.start),
            group: group.id,
          })
        : item
    )
    setItems(arr)

    console.log('Moved', itemId, dragTime, newGroupOrder)
  }

  const handleItemResize = (itemId, time, edge) => {
    const arr = items.map((item) =>
      item.id === itemId
        ? Object.assign({}, item, {
            start: edge === 'left' ? time : item.start,
            end: edge === 'left' ? item.end : time,
          })
        : item
    )
    setItems(arr)

    console.log('Resized', itemId, time, edge)
  }

  // this limits the timeline to -6 months ... +6 months
  const handleTimeChange = (
    visibleTimeStart,
    visibleTimeEnd,
    updateScrollCanvas
  ) => {
    if (visibleTimeStart < minTime && visibleTimeEnd > maxTime) {
      console.log(1)
      updateScrollCanvas(minTime, maxTime)
    } else if (visibleTimeStart < minTime) {
      console.log(2)
      updateScrollCanvas(minTime, minTime + (visibleTimeEnd - visibleTimeStart))
    } else if (visibleTimeEnd > maxTime) {
      console.log(3)
      updateScrollCanvas(maxTime - (visibleTimeEnd - visibleTimeStart), maxTime)
    } else {
      console.log(4)
      updateScrollCanvas(visibleTimeStart, visibleTimeEnd)
    }
  }

  const handleZoom = (timelineContext, unit) => {
    console.log('Zoomed', timelineContext, unit)
  }

  const moveResizeValidator = (action, item, time) => {
    if (time < new Date().getTime()) {
      var newTime =
        Math.ceil(new Date().getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000)
      return newTime
    }

    return time
  }

  return (
    <Timeline
      groups={groups}
      items={items}
      keys={keys}
      sidebarWidth={150}
      sidebarContent={<div>Above The Left</div>}
      canMove
      canResize="right"
      canSelect
      itemsSorted
      itemTouchSendsClick={false}
      stackItems
      itemHeightRatio={0.75}
      defaultTimeStart={defaultTimeStart}
      defaultTimeEnd={defaultTimeEnd}
      onCanvasClick={handleCanvasClick}
      onCanvasDoubleClick={handleCanvasDoubleClick}
      onCanvasContextMenu={handleCanvasContextMenu}
      onItemClick={handleItemClick}
      onItemSelect={handleItemSelect}
      onItemContextMenu={handleItemContextMenu}
      onItemMove={handleItemMove}
      onItemResize={handleItemResize}
      onItemDoubleClick={handleItemDoubleClick}
      onTimeChange={handleTimeChange}
      onZoom={handleZoom}
      moveResizeValidator={moveResizeValidator}
    >
      <TimelineMarkers>
        <TodayMarker />
        <CustomMarker
          date={moment().startOf('day').valueOf() + 1000 * 60 * 60 * 2}
        />
        <CustomMarker date={moment().add(3, 'day').valueOf()}>
          {({ styles }) => {
            const newStyles = { ...styles, backgroundColor: 'blue' }
            return <div style={newStyles} />
          }}
        </CustomMarker>
        <CursorMarker />
      </TimelineMarkers>
    </Timeline>
  )
}

export default App

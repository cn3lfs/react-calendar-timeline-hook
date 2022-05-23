import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { TimelineHeadersConsumer } from './HeadersContext'
import { TimelineStateConsumer } from '../timeline/TimelineStateContext'
import { iterateTimes, calculateXPositionForTime } from '../utility/calendar'

export function CustomHeader(props) {
  const [intervals, setIntervals] = useState([])

  const getHeaderIntervals = ({
    canvasTimeStart,
    canvasTimeEnd,
    unit,
    timeSteps,
    getLeftOffsetFromDate,
  }) => {
    const intervals = []
    iterateTimes(
      canvasTimeStart,
      canvasTimeEnd,
      unit,
      timeSteps,
      (startTime, endTime) => {
        const left = getLeftOffsetFromDate(startTime.valueOf())
        const right = getLeftOffsetFromDate(endTime.valueOf())
        const width = right - left
        intervals.push({
          startTime,
          endTime,
          labelWidth: width,
          left,
        })
      }
    )
    return intervals
  }

  const getRootProps = (nextProps = {}) => {
    const { style } = nextProps
    return {
      style: Object.assign({}, style ? style : {}, {
        position: 'relative',
        width: props.canvasWidth,
        height: props.height,
      }),
    }
  }

  const getIntervalProps = (nextProps = {}) => {
    const { interval, style } = nextProps
    if (!interval)
      throw new Error('you should provide interval to the prop getter')
    const { startTime, labelWidth, left } = interval
    return {
      style: getIntervalStyle({
        style,
        startTime,
        labelWidth,
        canvasTimeStart: props.canvasTimeStart,
        unit: props.unit,
        left,
      }),
      key: `label-${startTime.valueOf()}`,
    }
  }

  const getIntervalStyle = ({ left, labelWidth, style }) => {
    return {
      ...style,
      left,
      width: labelWidth,
      position: 'absolute',
    }
  }

  const getStateAndHelpers = () => {
    const {
      canvasTimeStart,
      canvasTimeEnd,
      unit,
      showPeriod,
      timelineWidth,
      visibleTimeStart,
      visibleTimeEnd,
      headerData,
    } = props
    //TODO: only evaluate on changing params
    return {
      timelineContext: {
        timelineWidth,
        visibleTimeStart,
        visibleTimeEnd,
        canvasTimeStart,
        canvasTimeEnd,
      },
      headerContext: {
        unit,
        intervals: intervals,
      },
      getRootProps: getRootProps,
      getIntervalProps: getIntervalProps,
      showPeriod,
      data: headerData,
    }
  }

  const updateIntervals = () => {
    const {
      canvasTimeStart,
      canvasTimeEnd,
      canvasWidth,
      unit,
      timeSteps,
      showPeriod,
      getLeftOffsetFromDate,
    } = props

    const intervals = getHeaderIntervals({
      canvasTimeStart,
      canvasTimeEnd,
      canvasWidth,
      unit,
      timeSteps,
      showPeriod,
      getLeftOffsetFromDate,
    })

    setIntervals(intervals)
  }

  useEffect(() => {
    updateIntervals()
  }, [
    props.canvasTimeStart,
    props.canvasTimeEnd,
    props.canvasWidth,
    props.unit,
    props.timeSteps,
    props.showPeriod,
  ])

  const nextProps = getStateAndHelpers()
  const Renderer = props.children
  return <Renderer {...nextProps} />
}

CustomHeader.propTypes = {
  //component props
  children: PropTypes.func.isRequired,
  unit: PropTypes.string.isRequired,
  //Timeline context
  timeSteps: PropTypes.object.isRequired,
  visibleTimeStart: PropTypes.number.isRequired,
  visibleTimeEnd: PropTypes.number.isRequired,
  canvasTimeStart: PropTypes.number.isRequired,
  canvasTimeEnd: PropTypes.number.isRequired,
  canvasWidth: PropTypes.number.isRequired,
  showPeriod: PropTypes.func.isRequired,
  headerData: PropTypes.object,
  getLeftOffsetFromDate: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired,
}

const CustomHeaderWrapper = ({ children, unit, headerData, height }) => (
  <TimelineStateConsumer>
    {({ getTimelineState, showPeriod, getLeftOffsetFromDate }) => {
      const timelineState = getTimelineState()
      return (
        <TimelineHeadersConsumer>
          {({ timeSteps }) => (
            <CustomHeader
              children={children}
              timeSteps={timeSteps}
              showPeriod={showPeriod}
              unit={unit ? unit : timelineState.timelineUnit}
              {...timelineState}
              headerData={headerData}
              getLeftOffsetFromDate={getLeftOffsetFromDate}
              height={height}
            />
          )}
        </TimelineHeadersConsumer>
      )
    }}
  </TimelineStateConsumer>
)

CustomHeaderWrapper.propTypes = {
  children: PropTypes.func.isRequired,
  unit: PropTypes.string,
  headerData: PropTypes.object,
  height: PropTypes.number,
}

CustomHeaderWrapper.defaultProps = {
  height: 30,
}

export default CustomHeaderWrapper

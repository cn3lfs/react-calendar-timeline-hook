import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { TimelineStateConsumer } from '../timeline/TimelineStateContext'
import CustomHeader from './CustomHeader'
import { getNextUnit } from '../utility/calendar'
import { defaultHeaderFormats } from '../default-config'
import { CustomDateHeader } from './CustomDateHeader'

function DateHeader(props) {
  const getHeaderUnit = () => {
    if (props.unit === 'primaryHeader') {
      return getNextUnit(props.timelineUnit)
    } else if (props.unit) {
      return props.unit
    }
    return props.timelineUnit
  }

  const getRootStyle = useCallback((style) => {
    return {
      height: 30,
      ...style,
    }
  }, [])

  const getLabelFormat = (interval, unit, labelWidth) => {
    const { labelFormat } = props
    if (typeof labelFormat === 'string') {
      const startTime = interval[0]
      return startTime.format(labelFormat)
    } else if (typeof labelFormat === 'function') {
      return labelFormat(interval, unit, labelWidth)
    } else {
      throw new Error('labelFormat should be function or string')
    }
  }

  const getHeaderData = useCallback(
    (
      intervalRenderer,
      style,
      className,
      getLabelFormat,
      unitProp,
      headerData
    ) => {
      return {
        intervalRenderer,
        style,
        className,
        getLabelFormat,
        unitProp,
        headerData,
      }
    },
    []
  )

  const unit = getHeaderUnit()
  const { headerData, height } = props
  return (
    <CustomHeader
      unit={unit}
      height={height}
      headerData={getHeaderData(
        props.intervalRenderer,
        getRootStyle(props.style),
        props.className,
        getLabelFormat,
        props.unit,
        props.headerData
      )}
      children={CustomDateHeader}
    />
  )
}

DateHeader.propTypes = {
  unit: PropTypes.string,
  style: PropTypes.object,
  className: PropTypes.string,
  timelineUnit: PropTypes.string,
  labelFormat: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
    PropTypes.string,
  ]).isRequired,
  intervalRenderer: PropTypes.func,
  headerData: PropTypes.object,
  height: PropTypes.number,
}

const DateHeaderWrapper = ({
  unit,
  labelFormat,
  style,
  className,
  intervalRenderer,
  headerData,
  height,
}) => (
  <TimelineStateConsumer>
    {({ getTimelineState }) => {
      const timelineState = getTimelineState()
      return (
        <DateHeader
          timelineUnit={timelineState.timelineUnit}
          unit={unit}
          labelFormat={labelFormat}
          style={style}
          className={className}
          intervalRenderer={intervalRenderer}
          headerData={headerData}
          height={height}
        />
      )
    }}
  </TimelineStateConsumer>
)

DateHeaderWrapper.propTypes = {
  style: PropTypes.object,
  className: PropTypes.string,
  unit: PropTypes.string,
  labelFormat: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
    PropTypes.string,
  ]),
  intervalRenderer: PropTypes.func,
  headerData: PropTypes.object,
  height: PropTypes.number,
}

DateHeaderWrapper.defaultProps = {
  labelFormat: formatLabel,
}

function formatLabel(
  [timeStart, timeEnd],
  unit,
  labelWidth,
  formatOptions = defaultHeaderFormats
) {
  let format
  if (labelWidth >= 150) {
    format = formatOptions[unit]['long']
  } else if (labelWidth >= 100) {
    format = formatOptions[unit]['mediumLong']
  } else if (labelWidth >= 50) {
    format = formatOptions[unit]['medium']
  } else {
    format = formatOptions[unit]['short']
  }
  return timeStart.format(format)
}

export default DateHeaderWrapper

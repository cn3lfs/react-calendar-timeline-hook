import React from 'react'
import PropTypes from 'prop-types'
import { getNextUnit } from '../utility/calendar'
import { composeEvents } from '../utility/events'

function Interval(props) {
  const onIntervalClick = () => {
    const { primaryHeader, interval, unit, showPeriod } = props
    if (primaryHeader) {
      const nextUnit = getNextUnit(unit)
      const newStartTime = interval.startTime.clone().startOf(nextUnit)
      const newEndTime = interval.startTime.clone().endOf(nextUnit)
      showPeriod(newStartTime, newEndTime)
    } else {
      showPeriod(interval.startTime, interval.endTime)
    }
  }

  const getIntervalProps = (nextProps = {}) => {
    return {
      ...props.getIntervalProps({
        interval: props.interval,
        ...nextProps,
      }),
      onClick: composeEvents(onIntervalClick, nextProps.onClick),
    }
  }

  const { intervalText, interval, intervalRenderer, headerData } = props
  const Renderer = intervalRenderer
  if (Renderer) {
    return (
      <Renderer
        getIntervalProps={getIntervalProps}
        intervalContext={{
          interval,
          intervalText,
        }}
        data={headerData}
      />
    )
  }

  return (
    <div
      data-testid="dateHeaderInterval"
      {...getIntervalProps({})}
      className={`rct-dateHeader ${
        props.primaryHeader ? 'rct-dateHeader-primary' : ''
      }`}
    >
      <span>{intervalText}</span>
    </div>
  )
}

Interval.propTypes = {
  intervalRenderer: PropTypes.func,
  unit: PropTypes.string.isRequired,
  interval: PropTypes.object.isRequired,
  showPeriod: PropTypes.func.isRequired,
  intervalText: PropTypes.string.isRequired,
  primaryHeader: PropTypes.bool.isRequired,
  getIntervalProps: PropTypes.func.isRequired,
  headerData: PropTypes.object,
}

export default Interval

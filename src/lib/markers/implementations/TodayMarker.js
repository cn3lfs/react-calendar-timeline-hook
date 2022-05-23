import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  createMarkerStylesWithLeftOffset,
  createDefaultRenderer,
} from './shared'
import { useInterval } from 'react-use'

const defaultRenderer = createDefaultRenderer('default-today-line')

/** Marker that is placed based on current date.  This component updates itself on
 * a set interval, dictated by the 'interval' prop.
 */

function TodayMarker(props) {
  const [date, setDate] = useState(Date.now())

  useInterval(() => {
    setDate(Date.now())
  }, props.interval)

  const leftOffset = props.getLeftOffsetFromDate(date)
  const styles = createMarkerStylesWithLeftOffset(leftOffset)
  return props.renderer({ styles, date })
}

TodayMarker.propTypes = {
  getLeftOffsetFromDate: PropTypes.func.isRequired,
  renderer: PropTypes.func,
  interval: PropTypes.number.isRequired,
}

TodayMarker.defaultProps = {
  renderer: defaultRenderer,
}

export default TodayMarker

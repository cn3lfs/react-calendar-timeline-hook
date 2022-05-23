import React from 'react'
import PropTypes from 'prop-types'
import {
  createMarkerStylesWithLeftOffset,
  createDefaultRenderer,
} from './shared'

const defaultCustomMarkerRenderer = createDefaultRenderer(
  'default-customer-marker-id'
)
/**
 * CustomMarker that is placed based on passed in date prop
 */
function CustomMarker(props) {
  const { date } = props
  const leftOffset = props.getLeftOffsetFromDate(date)

  const styles = createMarkerStylesWithLeftOffset(leftOffset)
  return props.renderer({ styles, date })
}

CustomMarker.propTypes = {
  getLeftOffsetFromDate: PropTypes.func.isRequired,
  renderer: PropTypes.func,
  date: PropTypes.number.isRequired,
}

CustomMarker.defaultProps = {
  renderer: defaultCustomMarkerRenderer,
}

export default CustomMarker

import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  createMarkerStylesWithLeftOffset,
  createDefaultRenderer,
} from './shared'
import { MarkerCanvasConsumer } from '../MarkerCanvasContext'

const defaultRenderer = createDefaultRenderer('default-cursor-marker')

/**
 * CursorMarker implementation subscribes to 'subscribeToCanvasMouseOver' on mount.
 * This subscription is passed in via MarkerCanvasConsumer, which is wired up to
 * MarkerCanvasProvider in the MarkerCanvas component. When the user mouses over MarkerCanvas,
 * the callback registered in CursorMarker (this component) is passed:
 *  leftOffset - pixels from left edge of canvas, used to position this element
 *  date - the date the cursor pertains to
 *  isCursorOverCanvas - whether the user cursor is over the canvas. This is set to 'false'
 *  when the user mouseleaves the element
 */

function CursorMarker(props) {
  const [state, setState] = useState({
    leftOffset: 0,
    date: 0,
    isShowingCursor: false,
  })

  const handleCanvasMouseOver = ({ leftOffset, date, isCursorOverCanvas }) => {
    setState({
      leftOffset,
      date,
      isShowingCursor: isCursorOverCanvas,
    })
  }

  const unsubscribe = useRef(null)

  useEffect(() => {
    unsubscribe.current = props.subscribeToCanvasMouseOver(
      handleCanvasMouseOver
    )
    return () => {
      if (unsubscribe.current != null) {
        unsubscribe.current()
        unsubscribe.current = null
      }
    }
  }, [])

  const { isShowingCursor, leftOffset, date } = state

  if (!isShowingCursor) return null

  const styles = createMarkerStylesWithLeftOffset(leftOffset)

  return props.renderer({ styles, date })
}

CursorMarker.propTypes = {
  subscribeToCanvasMouseOver: PropTypes.func.isRequired,
  renderer: PropTypes.func,
}

CursorMarker.defaultProps = {
  renderer: defaultRenderer,
}

// TODO: turn into HOC?
const CursorMarkerWrapper = (props) => {
  return (
    <MarkerCanvasConsumer>
      {({ subscribeToMouseOver }) => {
        return (
          <CursorMarker
            subscribeToCanvasMouseOver={subscribeToMouseOver}
            {...props}
          />
        )
      }}
    </MarkerCanvasConsumer>
  )
}

CursorMarkerWrapper.displayName = 'CursorMarkerWrapper'

export default CursorMarkerWrapper

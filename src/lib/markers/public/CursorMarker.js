import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { TimelineMarkersConsumer } from '../TimelineMarkersContext'
import { TimelineMarkerType } from '../markerType'

function CursorMarker(props) {
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    const { unsubscribe } = props.subscribeMarker({
      type: TimelineMarkerType.Cursor,
      renderer: props.children,
    })
    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current != null) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  return null
}

CursorMarker.propTypes = {
  subscribeMarker: PropTypes.func.isRequired,
  children: PropTypes.func,
}

// TODO: turn into HOC?
const CursorMarkerWrapper = (props) => {
  return (
    <TimelineMarkersConsumer>
      {({ subscribeMarker }) => (
        <CursorMarker subscribeMarker={subscribeMarker} {...props} />
      )}
    </TimelineMarkersConsumer>
  )
}

CursorMarkerWrapper.displayName = 'CursorMarkerWrapper'

export default CursorMarkerWrapper

import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { TimelineMarkersConsumer } from '../TimelineMarkersContext'
import { TimelineMarkerType } from '../markerType'

function CustomMarker(props) {
  const unsubscribeRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    const { unsubscribe, getMarker } = props.subscribeMarker({
      type: TimelineMarkerType.Custom,
      renderer: props.children,
      date: props.date,
    })
    unsubscribeRef.current = unsubscribe
    markerRef.current = getMarker

    return () => {
      if (unsubscribeRef.current != null) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current()
      props.updateMarker({
        ...marker,
        date: props.date,
      })
    }
  }, [props.date])

  return null
}

CustomMarker.propTypes = {
  subscribeMarker: PropTypes.func.isRequired,
  updateMarker: PropTypes.func.isRequired,
  children: PropTypes.func,
  date: PropTypes.number.isRequired,
}

// TODO: turn into HOC?
const CustomMarkerWrapper = (props) => {
  return (
    <TimelineMarkersConsumer>
      {({ subscribeMarker, updateMarker }) => (
        <CustomMarker
          subscribeMarker={subscribeMarker}
          updateMarker={updateMarker}
          {...props}
        />
      )}
    </TimelineMarkersConsumer>
  )
}

CustomMarkerWrapper.displayName = 'CustomMarkerWrapper'

export default CustomMarkerWrapper

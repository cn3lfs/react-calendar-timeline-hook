import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { TimelineMarkersConsumer } from '../TimelineMarkersContext'
import { TimelineMarkerType } from '../markerType'

function TodayMarker(props) {
  const unsubscribeRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    const { unsubscribe, getMarker } = props.subscribeMarker({
      type: TimelineMarkerType.Today,
      renderer: props.children,
      interval: props.interval,
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
        interval: props.interval,
      })
    }
  }, [props.interval])

  return null
}

TodayMarker.propTypes = {
  subscribeMarker: PropTypes.func.isRequired,
  updateMarker: PropTypes.func.isRequired,
  interval: PropTypes.number,
  children: PropTypes.func,
}

TodayMarker.defaultProps = {
  interval: 1000 * 10, // default to ten seconds
}

// TODO: turn into HOC?
const TodayMarkerWrapper = (props) => {
  return (
    <TimelineMarkersConsumer>
      {({ subscribeMarker, updateMarker }) => (
        <TodayMarker
          subscribeMarker={subscribeMarker}
          updateMarker={updateMarker}
          {...props}
        />
      )}
    </TimelineMarkersConsumer>
  )
}

TodayMarkerWrapper.displayName = 'TodayMarkerWrapper'

export default TodayMarkerWrapper

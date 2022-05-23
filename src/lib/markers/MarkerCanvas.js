import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { MarkerCanvasProvider } from './MarkerCanvasContext'
import TimelineMarkersRenderer from './TimelineMarkersRenderer'
import { TimelineStateConsumer } from '../timeline/TimelineStateContext'

// expand to fill entire parent container (ScrollElement)
const staticStyles = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
}

/**
 * Renders registered markers and exposes a mouse over listener for
 * CursorMarkers to subscribe to
 */
function MarkerCanvas(props) {
  const containerElRef = useRef(null)
  const subscriptionRef = useRef(null)

  const handleMouseMove = (evt) => {
    if (subscriptionRef.current != null) {
      const { pageX } = evt
      // FIXME: dont use getBoundingClientRect. Use passed in scroll amount
      const { left: containerLeft } =
        containerElRef.current.getBoundingClientRect()

      // number of pixels from left we are on canvas
      // we do this calculation as pageX is based on x from viewport whereas
      // our canvas can be scrolled left and right and is generally outside
      // of the viewport.  This calculation is to get how many pixels the cursor
      // is from left of this element
      const canvasX = pageX - containerLeft
      const date = props.getDateFromLeftOffsetPosition(canvasX)
      subscriptionRef.current({
        leftOffset: canvasX,
        date,
        isCursorOverCanvas: true,
      })
    }
  }

  const handleMouseLeave = () => {
    if (subscriptionRef.current != null) {
      // tell subscriber that we're not on canvas
      subscriptionRef.current({
        leftOffset: 0,
        date: 0,
        isCursorOverCanvas: false,
      })
    }
  }

  const handleMouseMoveSubscribe = (sub) => {
    subscriptionRef.current = sub
    return () => {
      subscriptionRef.current = null
    }
  }

  const state = {
    subscribeToMouseOver: handleMouseMoveSubscribe,
  }

  return (
    <MarkerCanvasProvider value={state}>
      <div
        style={staticStyles}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        ref={containerElRef}
      >
        <TimelineMarkersRenderer />
        {props.children}
      </div>
    </MarkerCanvasProvider>
  )
}

MarkerCanvas.propTypes = {
  getDateFromLeftOffsetPosition: PropTypes.func.isRequired,
  children: PropTypes.node,
}

const MarkerCanvasWrapper = (props) => (
  <TimelineStateConsumer>
    {({ getDateFromLeftOffsetPosition }) => (
      <MarkerCanvas
        getDateFromLeftOffsetPosition={getDateFromLeftOffsetPosition}
        {...props}
      />
    )}
  </TimelineStateConsumer>
)

export default MarkerCanvasWrapper

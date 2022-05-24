import React, { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getParentPosition } from '../utility/dom-helpers'
import { throttle } from 'lodash-es'

function ScrollElement(props) {
  const [isDragging, setIsDragging] = useState(false)

  const position = useRef({
    dragStartPosition: null,
    dragLastPosition: null,
  })
  const setPosition = (pos) => {
    position.current = pos
  }

  const scrollComponentRef = useRef(null)

  /**
   * needed to handle scrolling with trackpad
   */
  const handleScroll = () => {
    const scrollX = scrollComponentRef.current.scrollLeft
    props.onScroll(scrollX)
  }

  const handleWheel = (e) => {
    const { traditionalZoom } = props

    // zoom in the time dimension
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault()
      const parentPosition = getParentPosition(e.currentTarget)
      const xPosition = e.clientX - parentPosition.x

      const speed = e.ctrlKey ? 10 : e.metaKey ? 3 : 1

      // convert vertical zoom to horiziontal
      props.onWheelZoom(speed, xPosition, e.deltaY)
    } else if (e.shiftKey) {
      e.preventDefault()
      // shift+scroll event from a touchpad has deltaY property populated; shift+scroll event from a mouse has deltaX
      props.onScroll(
        scrollComponentRef.current.scrollLeft + (e.deltaY || e.deltaX)
      )
      // no modifier pressed? we prevented the default event, so scroll or zoom as needed
    }
  }

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setPosition({
        dragStartPosition: e.pageX,
        dragLastPosition: e.pageX,
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e) => {
    // props.onMouseMove(e)
    //why is interacting with item important?
    if (isDragging && !props.isInteractingWithItem) {
      props.onScroll(
        scrollComponentRef.current.scrollLeft +
          position.current.dragLastPosition -
          e.pageX
      )
      setPosition({
        dragStartPosition: position.current.dragStartPosition,
        dragLastPosition: e.pageX,
      })
    }
  }

  const handleMouseUp = () => {
    setPosition({
      dragStartPosition: null,
      dragLastPosition: null,
    })
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    // props.onMouseLeave(e)
    setPosition({
      dragStartPosition: null,
      dragLastPosition: null,
    })
    setIsDragging(false)
  }

  const [{ lastTouchDistance, singleTouchStart, lastSingleTouch }, setTouch] =
    useState({
      lastTouchDistance: null,
      singleTouchStart: null,
      lastSingleTouch: null,
    })

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault()

      setTouch({
        lastTouchDistance: Math.abs(
          e.touches[0].screenX - e.touches[1].screenX
        ),
        singleTouchStart: null,
        lastSingleTouch: null,
      })
    } else if (e.touches.length === 1) {
      e.preventDefault()

      let x = e.touches[0].clientX
      let y = e.touches[0].clientY

      setTouch({
        lastTouchDistance: null,
        singleTouchStart: { x: x, y: y, screenY: window.pageYOffset },
        lastSingleTouch: { x: x, y: y, screenY: window.pageYOffset },
      })
    }
  }

  const handleTouchMove = (e) => {
    const { isInteractingWithItem, width, onZoom } = props
    if (isInteractingWithItem) {
      e.preventDefault()
      return
    }
    if (lastTouchDistance && e.touches.length === 2) {
      e.preventDefault()
      let touchDistance = Math.abs(e.touches[0].screenX - e.touches[1].screenX)
      let parentPosition = getParentPosition(e.currentTarget)
      let xPosition =
        (e.touches[0].screenX + e.touches[1].screenX) / 2 - parentPosition.x
      if (touchDistance !== 0 && lastTouchDistance !== 0) {
        onZoom(lastTouchDistance / touchDistance, xPosition / width)
        setTouch({
          lastTouchDistance: touchDistance,
          singleTouchStart,
          lastSingleTouch,
        })
      }
    } else if (lastSingleTouch && e.touches.length === 1) {
      e.preventDefault()
      let x = e.touches[0].clientX
      let y = e.touches[0].clientY
      let deltaX = x - lastSingleTouch.x
      let deltaX0 = x - singleTouchStart.x
      let deltaY0 = y - singleTouchStart.y

      setTouch({
        lastTouchDistance: lastTouchDistance,
        singleTouchStart,
        lastSingleTouch: { x: x, y: y },
      })

      let moveX = Math.abs(deltaX0) * 3 > Math.abs(deltaY0)
      let moveY = Math.abs(deltaY0) * 3 > Math.abs(deltaX0)
      if (deltaX !== 0 && moveX) {
        props.onScroll(scrollComponentRef.current.scrollLeft - deltaX)
      }
      if (moveY) {
        window.scrollTo(window.pageXOffset, singleTouchStart.screenY - deltaY0)
      }
    }
  }

  const handleTouchEnd = () => {
    if (lastTouchDistance) {
      setTouch({
        lastTouchDistance: null,
        singleTouchStart,
        lastSingleTouch,
      })
    }
    if (lastSingleTouch) {
      setTouch({
        lastTouchDistance,
        singleTouchStart: null,
        lastSingleTouch: null,
      })
    }
  }

  useEffect(() => {
    props.scrollRef(scrollComponentRef.current)
    if (scrollComponentRef.current) {
      scrollComponentRef.current.addEventListener('wheel', handleWheel, {
        passive: false,
      })
    }

    return () => {
      if (scrollComponentRef.current) {
        scrollComponentRef.current.removeEventListener('wheel', handleWheel)
      }
    }
  }, [])

  const [scrollComponentStyle, setScrollComponentStyle] = useState({
    width: '1000px',
    height: '920px', //20px to push the scroll element down off screen...?
    cursor: 'default',
    position: 'relative',
  })

  useEffect(() => {
    const { width, height } = props

    const scrollComponentStyle = {
      width: `${width}px`,
      height: `${height + 20}px`, //20px to push the scroll element down off screen...?
      cursor: isDragging ? 'move' : 'default',
      position: 'relative',
    }
    setScrollComponentStyle(scrollComponentStyle)
  }, [props.width, props.height, isDragging])

  return (
    <div
      ref={scrollComponentRef}
      data-testid="scroll-element"
      className="rct-scroll"
      style={scrollComponentStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={handleScroll}
    >
      {props.children}
    </div>
  )
}

ScrollElement.propTypes = {
  children: PropTypes.element.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  traditionalZoom: PropTypes.bool.isRequired,
  scrollRef: PropTypes.func.isRequired,
  isInteractingWithItem: PropTypes.bool.isRequired,
  onZoom: PropTypes.func.isRequired,
  onWheelZoom: PropTypes.func.isRequired,
  onScroll: PropTypes.func.isRequired,
}

export default ScrollElement

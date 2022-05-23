import React, { useRef } from 'react'
import PropTypes from 'prop-types'

function PreventClickOnDrag(props) {
  const originClickX = useRef(null)
  const cancelClick = useRef(false)

  const handleMouseDown = (evt) => {
    originClickX.current = evt.clientX
  }

  const handleMouseUp = (evt) => {
    if (Math.abs(originClickX.current - evt.clientX) > props.clickTolerance) {
      cancelClick.current = true
    }
  }

  const handleClick = (evt) => {
    if (!cancelClick.current) {
      props.onClick(evt)
    }

    cancelClick.current = false
    originClickX.current = null
  }

  const childElement = React.Children.only(props.children)

  return React.cloneElement(childElement, {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onClick: handleClick,
  })
}

PreventClickOnDrag.propTypes = {
  children: PropTypes.element.isRequired,
  onClick: PropTypes.func.isRequired,
  clickTolerance: PropTypes.number.isRequired,
}

export default PreventClickOnDrag

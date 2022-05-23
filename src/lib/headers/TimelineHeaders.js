import React, { useRef, useEffect } from 'react'
import classNames from 'classnames'
import { TimelineHeadersConsumer } from './HeadersContext'
import PropTypes from 'prop-types'
import SidebarHeader from './SidebarHeader'
import { RIGHT_VARIANT } from './constants'

function TimelineHeaders(props) {
  const getRootStyle = () => {
    return {
      ...props.style,
      display: 'flex',
      width: '100%',
    }
  }

  const getCalendarHeaderStyle = () => {
    const { leftSidebarWidth, rightSidebarWidth, calendarHeaderStyle } = props
    return {
      ...calendarHeaderStyle,
      overflow: 'hidden',
      width: `calc(100% - ${leftSidebarWidth + rightSidebarWidth}px)`,
    }
  }

  const rootRef = useRef(null)

  useEffect(() => {
    if (props.headerRef) {
      props.headerRef(rootRef.current)
    }
  }, [])

  /**
   * check if child of type SidebarHeader
   * refer to for explanation https://github.com/gaearon/react-hot-loader#checking-element-types
   */
  const isSidebarHeader = (child) => {
    if (child.type === undefined) return false
    return child.type.secretKey === SidebarHeader.secretKey
  }

  let rightSidebarHeader
  let leftSidebarHeader
  let calendarHeaders = []
  const children = Array.isArray(props.children)
    ? props.children.filter((c) => c)
    : [props.children]
  React.Children.map(children, (child) => {
    if (isSidebarHeader(child)) {
      if (child.props.variant === RIGHT_VARIANT) {
        rightSidebarHeader = child
      } else {
        leftSidebarHeader = child
      }
    } else {
      calendarHeaders.push(child)
    }
  })
  if (!leftSidebarHeader) {
    leftSidebarHeader = <SidebarHeader />
  }
  if (!rightSidebarHeader && props.rightSidebarWidth) {
    rightSidebarHeader = <SidebarHeader variant="right" />
  }
  return (
    <div
      ref={rootRef}
      data-testid="headerRootDiv"
      style={getRootStyle()}
      className={classNames('rct-header-root', props.className)}
    >
      {leftSidebarHeader}
      <div
        ref={props.registerScroll}
        style={getCalendarHeaderStyle()}
        className={classNames(
          'rct-calendar-header',
          props.calendarHeaderClassName
        )}
        data-testid="headerContainer"
      >
        {calendarHeaders}
      </div>
      {rightSidebarHeader}
    </div>
  )
}

TimelineHeaders.propTypes = {
  registerScroll: PropTypes.func.isRequired,
  leftSidebarWidth: PropTypes.number.isRequired,
  rightSidebarWidth: PropTypes.number.isRequired,
  style: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  calendarHeaderStyle: PropTypes.object,
  calendarHeaderClassName: PropTypes.string,
  headerRef: PropTypes.func,
}

const TimelineHeadersWrapper = ({
  children,
  style,
  className,
  calendarHeaderStyle,
  calendarHeaderClassName,
}) => (
  <TimelineHeadersConsumer>
    {({ leftSidebarWidth, rightSidebarWidth, registerScroll }) => {
      return (
        <TimelineHeaders
          leftSidebarWidth={leftSidebarWidth}
          rightSidebarWidth={rightSidebarWidth}
          registerScroll={registerScroll}
          style={style}
          className={className}
          calendarHeaderStyle={calendarHeaderStyle}
          calendarHeaderClassName={calendarHeaderClassName}
        >
          {children}
        </TimelineHeaders>
      )
    }}
  </TimelineHeadersConsumer>
)

TimelineHeadersWrapper.propTypes = {
  style: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  calendarHeaderStyle: PropTypes.object,
  calendarHeaderClassName: PropTypes.string,
}

TimelineHeadersWrapper.secretKey = 'TimelineHeaders'

export default TimelineHeadersWrapper

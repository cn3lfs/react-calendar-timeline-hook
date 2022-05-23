import React from 'react'
import PropTypes from 'prop-types'
import { TimelineHeadersConsumer } from './HeadersContext'
import { LEFT_VARIANT, RIGHT_VARIANT } from './constants'

function SidebarHeader(props) {
  const getRootProps = (nextProps = {}) => {
    const { style } = nextProps
    const width =
      props.variant === RIGHT_VARIANT
        ? props.rightSidebarWidth
        : props.leftSidebarWidth
    return {
      style: {
        ...style,
        width,
      },
    }
  }

  const getStateAndHelpers = () => {
    return {
      getRootProps: getRootProps,
      data: props.headerData,
    }
  }

  const nextProps = getStateAndHelpers()
  const Renderer = props.children
  return <Renderer {...nextProps} />
}

SidebarHeader.propTypes = {
  children: PropTypes.func.isRequired,
  rightSidebarWidth: PropTypes.number,
  leftSidebarWidth: PropTypes.number.isRequired,
  variant: PropTypes.string,
  headerData: PropTypes.object,
}

const SidebarWrapper = ({ children, variant, headerData }) => (
  <TimelineHeadersConsumer>
    {({ leftSidebarWidth, rightSidebarWidth }) => {
      return (
        <SidebarHeader
          leftSidebarWidth={leftSidebarWidth}
          rightSidebarWidth={rightSidebarWidth}
          children={children}
          variant={variant}
          headerData={headerData}
        />
      )
    }}
  </TimelineHeadersConsumer>
)

SidebarWrapper.propTypes = {
  children: PropTypes.func.isRequired,
  variant: PropTypes.string,
  headerData: PropTypes.object,
}

SidebarWrapper.defaultProps = {
  variant: LEFT_VARIANT,
  children: ({ getRootProps }) => (
    <div data-testid="sidebarHeader" {...getRootProps()} />
  ),
}

SidebarWrapper.secretKey = 'SidebarHeader'

export default SidebarWrapper

import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { _get, arraysEqual } from '../utility/generic'

function Sidebar(props) {
  const renderGroupContent = (
    group,
    isRightSidebar,
    groupTitleKey,
    groupRightTitleKey
  ) => {
    if (props.groupRenderer) {
      return React.createElement(props.groupRenderer, {
        group,
        isRightSidebar,
      })
    } else {
      return _get(group, isRightSidebar ? groupRightTitleKey : groupTitleKey)
    }
  }

  const { width, groupHeights, height, isRightSidebar } = props

  const { groupIdKey, groupTitleKey, groupRightTitleKey } = props.keys

  const sidebarStyle = {
    width: `${width}px`,
    height: `${height}px`,
  }

  const groupsStyle = {
    width: `${width}px`,
  }

  let groupLines = props.groups.map((group, index) => {
    const elementStyle = {
      height: `${groupHeights[index]}px`,
      lineHeight: `${groupHeights[index]}px`,
    }

    return (
      <div
        key={_get(group, groupIdKey)}
        className={
          'rct-sidebar-row rct-sidebar-row-' +
          (index % 2 === 0 ? 'even' : 'odd')
        }
        style={elementStyle}
      >
        {renderGroupContent(
          group,
          isRightSidebar,
          groupTitleKey,
          groupRightTitleKey
        )}
      </div>
    )
  })

  return (
    <div
      className={'rct-sidebar' + (isRightSidebar ? ' rct-sidebar-right' : '')}
      style={sidebarStyle}
    >
      <div style={groupsStyle}>{groupLines}</div>
    </div>
  )
}

Sidebar.propTypes = {
  groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  groupHeights: PropTypes.array.isRequired,
  keys: PropTypes.object.isRequired,
  groupRenderer: PropTypes.func,
  isRightSidebar: PropTypes.bool,
}

export default Sidebar

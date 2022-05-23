import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PreventClickOnDrag from '../interaction/PreventClickOnDrag'

function GroupRow(props) {
  const {
    onContextMenu,
    onDoubleClick,
    isEvenRow,
    style,
    onClick,
    clickTolerance,
    horizontalLineClassNamesForGroup,
    group,
  } = props

  let classNamesForGroup = []
  if (horizontalLineClassNamesForGroup) {
    classNamesForGroup = horizontalLineClassNamesForGroup(group)
  }

  return (
    <PreventClickOnDrag clickTolerance={clickTolerance} onClick={onClick}>
      <div
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        className={
          (isEvenRow ? 'rct-hl-even ' : 'rct-hl-odd ') +
          (classNamesForGroup ? classNamesForGroup.join(' ') : '')
        }
        style={style}
      />
    </PreventClickOnDrag>
  )
}

GroupRow.propTypes = {
  onClick: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
  onContextMenu: PropTypes.func.isRequired,
  isEvenRow: PropTypes.bool.isRequired,
  style: PropTypes.object.isRequired,
  clickTolerance: PropTypes.number.isRequired,
  group: PropTypes.object.isRequired,
  horizontalLineClassNamesForGroup: PropTypes.func,
}

export default GroupRow

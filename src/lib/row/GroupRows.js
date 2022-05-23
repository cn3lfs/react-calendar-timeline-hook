import PropTypes from 'prop-types'
import React from 'react'
import GroupRow from './GroupRow'

function GroupRows(props) {
  const {
    canvasWidth,
    lineCount,
    groupHeights,
    onRowClick,
    onRowDoubleClick,
    clickTolerance,
    groups,
    horizontalLineClassNamesForGroup,
    onRowContextClick,
  } = props
  let lines = []

  for (let i = 0; i < lineCount; i++) {
    lines.push(
      <GroupRow
        clickTolerance={clickTolerance}
        onContextMenu={(evt) => onRowContextClick(evt, i)}
        onClick={(evt) => onRowClick(evt, i)}
        onDoubleClick={(evt) => onRowDoubleClick(evt, i)}
        key={`horizontal-line-${i}`}
        isEvenRow={i % 2 === 0}
        group={groups[i]}
        horizontalLineClassNamesForGroup={horizontalLineClassNamesForGroup}
        style={{
          width: `${canvasWidth}px`,
          height: `${groupHeights[i]}px`,
        }}
      />
    )
  }

  return <div className="rct-horizontal-lines">{lines}</div>
}

GroupRows.propTypes = {
  canvasWidth: PropTypes.number.isRequired,
  lineCount: PropTypes.number.isRequired,
  groupHeights: PropTypes.array.isRequired,
  onRowClick: PropTypes.func.isRequired,
  onRowDoubleClick: PropTypes.func.isRequired,
  clickTolerance: PropTypes.number.isRequired,
  groups: PropTypes.array.isRequired,
  horizontalLineClassNamesForGroup: PropTypes.func,
  onRowContextClick: PropTypes.func.isRequired,
}

export default GroupRows

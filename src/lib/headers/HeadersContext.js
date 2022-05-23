import React, { createContext } from 'react'
import PropTypes from 'prop-types'
import { noop } from '../utility/generic'

const defaultContextState = {
  registerScroll: () => {
    // eslint-disable-next-line
    console.warn('default registerScroll header used')
    return noop
  },
  rightSidebarWidth: 0,
  leftSidebarWidth: 150,
  timeSteps: {},
}

const { Consumer, Provider } = createContext(defaultContextState)

export function TimelineHeadersProvider(props) {
  const contextValue = {
    rightSidebarWidth: props.rightSidebarWidth,
    leftSidebarWidth: props.leftSidebarWidth,
    timeSteps: props.timeSteps,
    registerScroll: props.registerScroll,
  }
  return <Provider value={contextValue}>{props.children}</Provider>
}

TimelineHeadersProvider.propTypes = {
  children: PropTypes.element.isRequired,
  rightSidebarWidth: PropTypes.number,
  leftSidebarWidth: PropTypes.number.isRequired,
  //TODO: maybe this should be skipped?
  timeSteps: PropTypes.object.isRequired,
  registerScroll: PropTypes.func.isRequired,
}

export const TimelineHeadersConsumer = Consumer

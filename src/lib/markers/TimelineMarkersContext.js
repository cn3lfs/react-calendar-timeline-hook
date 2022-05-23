import React, { createContext, useState } from 'react'

import PropTypes from 'prop-types'
import { noop } from '../utility/generic'

const defaultContextState = {
  markers: [],
  subscribeMarker: () => {
    // eslint-disable-next-line
    console.warn('default subscribe marker used')
    return noop
  },
}

const { Consumer, Provider } = createContext(defaultContextState)

// REVIEW: is this the best way to manage ids?
let _id = 0
const createId = () => {
  _id += 1
  return _id + 1
}

export function TimelineMarkersProvider(props) {
  const handleSubscribeToMarker = (newMarker) => {
    newMarker = {
      ...newMarker,
      // REVIEW: in the event that we accept id to be passed to the Marker components, this line would override those
      id: createId(),
    }

    setState((state) => {
      return {
        ...state,
        markers: [...state.markers, newMarker],
      }
    })
    return {
      unsubscribe: () => {
        setState((state) => {
          return {
            ...state,
            markers: state.markers.filter(
              (marker) => marker.id !== newMarker.id
            ),
          }
        })
      },
      getMarker: () => {
        return newMarker
      },
    }
  }

  const handleUpdateMarker = (updateMarker) => {
    const markerIndex = state.markers.findIndex(
      (marker) => marker.id === updateMarker.id
    )
    if (markerIndex < 0) return
    setState((state) => {
      return {
        ...state,
        markers: [
          ...state.markers.slice(0, markerIndex),
          updateMarker,
          ...state.markers.slice(markerIndex + 1),
        ],
      }
    })
  }

  const [state, setState] = useState({
    markers: [],
    subscribeMarker: handleSubscribeToMarker,
    updateMarker: handleUpdateMarker,
  })

  return <Provider value={state}>{props.children}</Provider>
}

TimelineMarkersProvider.propTypes = {
  children: PropTypes.element.isRequired,
}

export const TimelineMarkersConsumer = Consumer

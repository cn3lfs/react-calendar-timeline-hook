import React from 'react'
import { createRoot } from 'react-dom/client'
import 'react-calendar-timeline-css'
import App from './app'

const container = document.getElementById('root')
const root = createRoot(container)

const render = (AppToRender) => {
  root.render(<AppToRender />)
}

render(App)

if (module.hot) {
  module.hot.accept('./app', () => {
    const NextApp = React.lazy(() => import('./app'))
    render(NextApp)
  })
}

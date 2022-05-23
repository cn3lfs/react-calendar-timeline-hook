import './styles.scss'

import React from 'react'
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom'

import DemoMain from './demo-main'
import DemoPerformance from './demo-performance'
import DemoTreeGroups from './demo-tree-groups'
import DemoLinkedTimelines from './demo-linked-timelines'
import DemoElementResize from './demo-element-resize'
import DemoRenderers from './demo-renderers'
import DemoVerticalClasses from './demo-vertical-classes'
import DemoCustomItems from './demo-custom-items'
import DemoHeaders from './demo-headers'
import DemoCustomInfoLabel from './demo-custom-info-label'
import DemoControlledSelect from './demo-controlled-select'

const demos = {
  main: <DemoMain />,
  performance: <DemoPerformance />,
  treeGroups: <DemoTreeGroups />,
  linkedTimelines: <DemoLinkedTimelines />,
  elementResize: <DemoElementResize />,
  renderers: <DemoRenderers />,
  verticalClasses: <DemoVerticalClasses />,
  customItems: <DemoCustomItems />,
  customHeaders: <DemoHeaders />,
  customInfoLabel: <DemoCustomInfoLabel />,
  controledSelect: <DemoControlledSelect />,
}

// A simple component that shows the pathname of the current location
function Menu(props) {
  let location = useLocation()
  let pathname = location.pathname

  if (!pathname || pathname === '/') {
    pathname = `/${Object.keys(demos)[0]}`
  }

  return (
    <div
      className={`demo-row${pathname.indexOf('sticky') >= 0 ? ' sticky' : ''}`}
    >
      Choose the demo:
      {Object.keys(demos).map((key) => (
        <Link
          key={key}
          className={pathname === `/${key}` ? 'selected' : ''}
          to={`/${key}`}
        >
          {key}
        </Link>
      ))}
    </div>
  )
}

function App() {
  return (
    <Router>
      <div>
        <Menu />
        <div className="demo-demo">
          <Routes>
            <Route path="/" exact element={demos[Object.keys(demos)[0]]} />
            {Object.keys(demos).map((key) => (
              <Route key={key} path={`/${key}`} element={demos[key]} />
            ))}
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App

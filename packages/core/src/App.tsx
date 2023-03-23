import { useMemo, type ReactElement } from 'react'
import { Outlet, ReactLocation, Router, type Route } from '@tanstack/react-location'
/* import { ReactLocationDevtools } from '@tanstack/react-location-devtools' */

import { useQuery } from '@apollo/client'
import { GET_PAGE_BY_NAME } from 'api/Page/query'
import { PageLoader } from '@netherite/ds-components'

import { Page } from 'pages/Page/Page'

const location = new ReactLocation()

type TemplateTypes = 'PAGE'
| 'INBOX'
| 'SEARCH'
| 'GOALS'
| 'GOAL'
| 'PROJECTS'
| 'PROJECT'
| 'TASK'
| 'TOPICS'
| 'TOPIC'
| 'STATS'
| 'LABELS'
| 'GRAPH'

const Templates: Record<TemplateTypes, ReactElement> = {
  PAGE: <Page />,

  INBOX: <h1>INBOX</h1>,
  SEARCH: <h1>SEARCH</h1>,

  GOALS: <h1>GOALS</h1>,
  GOAL: <h1>GOAL</h1>,

  PROJECTS: <h1>PROJECTS</h1>,
  PROJECT: <h1>PROJECT</h1>,
  TASK: <h1>TASK</h1>,

  TOPICS: <h1>TOPICS</h1>,
  TOPIC: <h1>TOPIC</h1>,

  STATS: <h1>STATS</h1>,
  LABELS: <h1>LABELS</h1>,
  GRAPH: <h1>GRAPH</h1>,
}

type RawRoute = Partial<Omit<Route, 'element' | 'children'>> & {
  element: TemplateTypes,
  children: RawRoute[],
}

export const App = () => {
  const { data, loading } = useQuery(GET_PAGE_BY_NAME, {
    variables: { name: 'main' }
  })

  const routes: Route[] = useMemo(() => {
    const routesDefinition = data?.getPageByName?.routes
    return routesDefinition?.map(mapRoutes)
  }, [data])

  return (loading || !routes) ? <PageLoader /> : (
    <Router location={location} routes={routes}>
      {/* <ReactLocationDevtools initialIsOpen={false} /> */}
      <Outlet />
    </Router>
  )
}

function mapRoutes ({ path, element, children }: RawRoute): Partial<Route> {
  return {
    path,
    element: Templates[element],
    children: children?.map(mapRoutes)
  }
}

import { useMemo, type ReactElement } from 'react'
import { Outlet, ReactLocation, Router, type Route } from '@tanstack/react-location'

import { Page } from 'pages/Page/Page'
import { useAppSettings } from 'providers/AppSettings.provider'

const location = new ReactLocation()

type TemplateTypes = 'PAGE'
| 'REDIRECT'
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
  REDIRECT: <Page />,
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
  children?: RawRoute[],
}

export const RoutesProvider = () => {
  const data = useAppSettings()
  const routes: Route[] = useMemo(() => {
    const routesDefinition = (data?.routes ?? []) as RawRoute[]

    return routesDefinition?.map((route: RawRoute) => mapRoutes(route))
  }, [data])

  return (
    <Router location={location} routes={routes}>
      <Outlet />
    </Router>
  )
}

function mapRoutes ({ path, element, children }: RawRoute): Partial<Route> {
  const Template = Templates[element]

  return {
    path,
    element: Template,
    children: children?.map((route: RawRoute) => mapRoutes(route))
  }
}

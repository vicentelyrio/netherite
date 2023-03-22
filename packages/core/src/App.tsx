import { useMemo, type ReactElement } from 'react'
import { Outlet, ReactLocation, Router, type Route } from '@tanstack/react-location'
import { ReactLocationDevtools } from '@tanstack/react-location-devtools'
import { useQuery } from '@apollo/client'
import { GET_PAGE_BY_NAME } from 'api/Page/query'
import { Navigation, Page, PageLoader } from '@netherite/ds-components'

const location = new ReactLocation()

const Main = () => {
  return (
    <Page navigation={<Navigation />} workspace={<Outlet />} />
  )
}

type TemplateTypes = 'PAGE' | 'GOALS' | 'GOAL' | 'PROJECT' | 'TASK'

const Templates: Record<TemplateTypes, ReactElement> = {
  PAGE: <Main />,
  GOALS: <h1>GOALS</h1>,
  GOAL: <h1>GOAL</h1>,
  PROJECT: <h1>PROJECT</h1>,
  TASK: <h1>TASK</h1>,
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
      <ReactLocationDevtools initialIsOpen={false} />
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

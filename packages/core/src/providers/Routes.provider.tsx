import { useMemo } from 'react'
import {
  createMemoryHistory,
  createBrowserHistory,
  Outlet,
  ReactLocation,
  Router,
  type Route
} from '@tanstack/react-location'

import { useAppSettings } from 'providers/AppSettings.provider'

import { Page } from 'layout/Page/Page'
import { Workspace, type WorkspaceNames } from 'layout/Workspace/Workspace'

const standalone = import.meta.env.DEV

const history = (standalone: boolean) => (
  standalone ? createBrowserHistory() : createMemoryHistory()
)

const location = new ReactLocation({ history: history(standalone) })

type TemplateTypesNames = 'DASHBOARD' | 'PAGE' | 'WORKSPACE'

type TemplateTypes = typeof Page | typeof Workspace

const Templates: Record<TemplateTypesNames, TemplateTypes> = {
  DASHBOARD: Page,
  PAGE: Page,
  WORKSPACE: Workspace,
}

type RawRoute = Partial<Omit<Route, 'children'>> & {
  templateType: TemplateTypesNames,
  workspaceType: string,
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

function mapRoutes (route: RawRoute): Partial<Route> {
  const { path, templateType, workspaceType, children } = route
  const Template = Templates[templateType] ?? Page

  return {
    path,
    element: <Template type={workspaceType as WorkspaceNames} />,
    children: children?.map((route: RawRoute) => mapRoutes(route))
  }
}


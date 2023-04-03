import { useMemo } from 'react'
import { Outlet, ReactLocation, Router, type Route } from '@tanstack/react-location'

import { useAppSettings } from 'providers/AppSettings.provider'

import { Page } from 'layout/Page/Page'
import { Workspace } from 'layout/Workspace/Workspace'

const location = new ReactLocation()

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

function mapRoutes ({ path, templateType, workspaceType, children }: RawRoute): Partial<Route> {
  const Template = Templates[templateType] ?? Page

  return {
    path,
    element: <Template type={workspaceType} />,
    children: children?.map((route: RawRoute) => mapRoutes(route))
  }
}


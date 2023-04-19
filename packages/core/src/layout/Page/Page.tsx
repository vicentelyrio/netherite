import type { ReactElement } from 'react'
import { Outlet } from '@tanstack/react-location'
import { Page as PageLayout } from '@netherite/ds-components'

import { Navigation } from 'layout/Navigation/Navigation'

export const Page = (): ReactElement => (
  <PageLayout
    navigation={<Navigation />}
    workspace={<Outlet />}
  />
)


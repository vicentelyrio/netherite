import { useMemo, type ReactElement } from 'react'
import { Link, Outlet } from '@tanstack/react-location'
import { Navigation, Page as PageLayout } from '@netherite/ds-components'

import {
  IconBrandLogo,
  IconUiGoal,
  IconUiGraph,
  IconUiInbox,
  IconUiLabel,
  IconUiProject,
  IconUiSearch,
  IconUiStats,
  IconUiTopic,
} from '@netherite/ds-assets'

const Nav = () => {
  const navigation = useMemo(() => ({
    brand: { to: '/', icon: IconBrandLogo, as: Link },
    search: { to: '/search', icon: IconUiSearch, as: Link },
    inbox: { to: '/inbox', icon: IconUiInbox, as: Link },
    primaryOptions: [
      { to: '/goals', icon: IconUiGoal, as: Link },
      { to: '/projects', icon: IconUiProject, as: Link },
      { to: '/topics', icon: IconUiTopic, as: Link },
    ],
    secondaryOptions: [
      { to: '/stats', icon: IconUiStats, as: Link },
      { to: '/labels', icon: IconUiLabel, as: Link },
      { to: '/graph', icon: IconUiGraph, as: Link },
    ],
  }), [])

  return (
    <Navigation {...navigation} />
  )
}

export const Page = (): ReactElement => {
  return (
    <PageLayout
      navigation={<Nav />}
      workspace={<Outlet />}
    />
  )
}


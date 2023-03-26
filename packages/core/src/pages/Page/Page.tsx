import { useMemo, type ReactElement, type ReactPropTypes } from 'react'
import { Link, Outlet } from '@tanstack/react-location'
import { Navigation, Page as PageLayout } from '@netherite/ds-components'

import * as ICONS from '@netherite/ds-assets'

import { useAppSettings } from 'providers/AppSettings.provider'

console.log(ICONS)

const Nav = () => {
  const { navbar } = useAppSettings()

  const navigation = useMemo(() => {
    return {
      brand: mapLink(navbar?.brand),
      search: mapLink(navbar?.search),
      inbox: mapLink(navbar?.inbox),
      primaryOptions: navbar?.primaryOptions?.map(mapLink),
      secondaryOptions: navbar?.secondaryOptions?.map(mapLink),
    }
  }, [navbar])

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

const mapLink = ({ to, icon }: { to: string, icon: string }) => ({
  as: (props: ReactPropTypes) => (
    <Link {...props} getActiveProps={() => ({ style: { color: 'green' }, })} />
  ),
  to,
  icon: ICONS[icon] as ReactElement
})

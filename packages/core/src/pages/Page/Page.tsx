import { useMemo, type ReactElement, type ReactPropTypes } from 'react'
import { Link, Outlet } from '@tanstack/react-location'
import { Navigation, Page as PageLayout } from '@netherite/ds-components'

import { Icons, type IconsType } from '@netherite/ds-assets'

import { useAppSettings, type AppSettingsType } from 'providers/AppSettings.provider'

const Nav = () => {
  const { navbar }: AppSettingsType = useAppSettings()

  const navigation = useMemo(() => {
    const { brand, search, inbox, primaryOptions, secondaryOptions } = navbar ?? {}

    return {
      brand: mapLink(brand),
      search: mapLink(search),
      inbox: mapLink(inbox),
      primaryOptions: primaryOptions?.map(mapLink),
      secondaryOptions: secondaryOptions?.map(mapLink),
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
  icon: Icons[icon as IconsType]
})

import { useMemo, type ReactElement, type ReactPropTypes } from 'react'
import { Link, Outlet } from '@tanstack/react-location'
import { Icons, type IconsType } from '@netherite/ds-assets'
import {
  Navigation,
  type NavigationItem,
  type NavigationAvatar,
  Page as PageLayout,
} from '@netherite/ds-components'

import { useAppSettings, type AppSettingsType } from 'providers/AppSettings.provider'

const Nav = () => {
  const { navbar }: AppSettingsType = useAppSettings()

  const navigation = useMemo(() => {
    const { brand, search, inbox, primaryOptions, secondaryOptions } = navbar ?? {}

    return {
      brand: mapLink(brand as NavigationItem),
      search: mapLink(search as NavigationItem),
      inbox: mapLink(inbox as NavigationItem),
      primaryOptions: primaryOptions?.map((value) => mapLink(value as NavigationItem)),
      secondaryOptions: secondaryOptions?.map((value) => mapLink(value as NavigationItem)),
      user: {
        children: 'vl',
        title: 'Vicente Lyrio',
        to: '/settings',
        color: 'accentYellow',
        as: Link
      } as NavigationAvatar
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


const mapLink = ({ to, icon, color, colorActive }: NavigationItem) => ({
  as: (props: ReactPropTypes) => (
    <Link {...props} getActiveProps={getActiveProps} />
  ),
  to,
  color,
  colorActive,
  icon: Icons[icon as IconsType]
})

const getActiveProps = () => ({
  className: 'active'
})


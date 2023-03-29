import { useMemo, type ReactElement, type ReactPropTypes } from 'react'
import { Link, Outlet } from '@tanstack/react-location'
import { theme } from '@netherite/ds-tokens'
import { Icons, type IconsType } from '@netherite/ds-assets'
import { Navigation, Page as PageLayout, type NavigationItem } from '@netherite/ds-components'

import { useAppSettings, type AppSettingsType } from 'providers/AppSettings.provider'

const Nav = () => {
  const { navbar }: AppSettingsType = useAppSettings()

  const navigation = useMemo(() => {
    const { brand, search, inbox, primaryOptions, secondaryOptions } = navbar ?? {}

    return {
      brand: mapLink(brand as NavigationItem),
      search: mapLink(search as NavigationItem),
      inbox: mapLink(inbox as NavigationItem),
      primaryOptions: primaryOptions?.map((value: NavigationItem) => mapLink(value)),
      secondaryOptions: secondaryOptions?.map((value: NavigationItem) => mapLink(value)),
      user: {
        initials: 'vl',
        title: 'Vicente Lyrio',
        to: '/settings'
      }
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


const mapLink = ({ to, icon, color, colorActive = 'accent' }: NavigationItem) => ({
  as: (props: ReactPropTypes) => (
    <Link {...props} getActiveProps={getActiveProps(colorActive)} />
  ),
  to,
  color,
  icon: Icons[icon as IconsType]
})

const getActiveProps = (color: keyof typeof theme.colors) => () => ({
  style: { color: theme?.colors[color] },
  cursor: 'default'
})


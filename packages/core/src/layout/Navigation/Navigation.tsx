import { useMemo, type ReactPropTypes } from 'react'
import { Link } from '@tanstack/react-location'
import { Icons, type IconsType } from '@netherite/ds-assets'
import {
  Navigation as NavigationLayout,
  type NavigationItem,
  type NavigationAvatar,
} from '@netherite/ds-components'

import { useAppSettings, type AppSettingsType } from 'providers/AppSettings.provider'

export const Navigation = () => {
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
    <NavigationLayout {...navigation} />
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


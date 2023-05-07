import { useMemo, type ReactNode } from 'react'
import { Link } from '@tanstack/react-location'

import type { Theme } from '@netherite/ds-tokens'
import { Icons, type IconsType } from '@netherite/ds-assets'
import type { NavLink } from '@netherite/service-graphql'
import {
  Navigation as NavigationLayout,
  type NavigationAvatar,
  type NavigationItem,
} from '@netherite/ds-components'

import { useAppSettings, type AppSettingsType } from 'providers/AppSettings.provider'

export const Navigation = () => {
  const { navbar }: AppSettingsType = useAppSettings()

  const navigation = useMemo(() => {
    const { brand, search, inbox, primaryOptions, secondaryOptions } = navbar ?? {}

    return {
      brand: mapLink(brand),
      search: mapLink(search),
      inbox: mapLink(inbox),
      primaryOptions: primaryOptions?.map((value) => mapLink(value)),
      secondaryOptions: secondaryOptions?.map((value) => mapLink(value)),
      user: {
        children: 'vl' as ReactNode,
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

const mapLink = ({ to, icon, color, colorActive }: NavLink): NavigationItem => ({
  as: (props) => (
    <Link {...props} getActiveProps={getActiveProps} />
  ),
  to,
  color: color as keyof Theme['colors'],
  colorActive: colorActive as keyof Theme['colors'],
  icon: Icons[icon as IconsType]
})

const getActiveProps = () => ({
  className: 'active'
})


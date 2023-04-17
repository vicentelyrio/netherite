/** @jsxImportSource theme-ui */
import type { Theme } from '@netherite/ds-tokens'
import type { ReactElement } from 'react'
import type { ThemeUIStyleObject } from 'theme-ui'

import * as Styled from './Navigation.styles'

export type NavigationItem = {
  icon: any // eslint-disable-line @typescript-eslint/no-explicit-any
  title?: string
  to?: string
  className?: string
  sx?: ThemeUIStyleObject
  color?: keyof Theme['colors']
  colorActive?: keyof Theme['colors']
}

export type NavigationAvatar = Omit<NavigationItem, 'icon'> & {
  children: ReactElement
}

export type NavigationProps = {
  className?: string
  brand?: NavigationItem
  search?: NavigationItem
  inbox?: NavigationItem
  user?: NavigationAvatar
  primaryOptions?: NavigationItem[]
  secondaryOptions?: NavigationItem[]
}

export const Navigation = ({
  className,
  brand,
  search,
  inbox,
  user,
  primaryOptions = [],
  secondaryOptions = [],
}: NavigationProps): ReactElement => {
  return (
    <Styled.Navigation className={className} sx={{ bg: 'backgroundDark', py: 3 }}>
      {brand && <Item {...brand} sx={{ mt: 1 }} />}
      {search && <Item {...search} sx={{ mt: 4 }} />}

      <Styled.NavSecondary sx={{
          bg: 'shadow',
          py: 3
        }}>

        {inbox && <Item {...inbox} />}

        <Styled.NavPrimary sx={{
          bg: 'shadowDark',
          py: 3,
          my: 3,
        }}>
          {primaryOptions.length > 0 && primaryOptions.map(Item)}
        </Styled.NavPrimary>

        {secondaryOptions.length > 0 && secondaryOptions.map(Item)}
      </Styled.NavSecondary>

      {user && <Styled.NavAvatar {...user} color={user.color} />}
    </Styled.Navigation>
  )
}

const Item = ({ icon: Icon, sx, colorActive, color, ...rest }: NavigationItem, index?: number): ReactElement => (
  <Styled.NavItem
    sx={{
      color,
      my: 1,
      '&.active': { color: colorActive },
      ...sx
    }}
    {...rest} key={index}>
    {Icon && <Icon />}
  </Styled.NavItem>
)

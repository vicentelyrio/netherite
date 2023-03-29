/** @jsxImportSource theme-ui */
import type { theme } from '@netherite/ds-tokens'
import type { ReactElement } from 'react'
import type { ThemeUIStyleObject } from 'theme-ui'

import * as Styled from './Navigation.styles'

export type NavigationItem = {
  icon: any // eslint-disable-line @typescript-eslint/no-explicit-any
  title?: string
  to?: string
  className?: string
  sx?: ThemeUIStyleObject
  color?: keyof typeof theme.colors
  colorActive?: keyof typeof theme.colors
}

export type NavigationAvatar = Omit<NavigationItem, 'icon'> & {
  initials: string
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
  /* user, */
  primaryOptions = [],
  secondaryOptions = [],
}: NavigationProps): ReactElement => {
  return (
    <Styled.Navigation className={className} sx={{ bg: 'backgroundDark' }}>
      {brand && <Item {...brand} sx={{ mt: 3 }} />}
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

      {/* {user && <Item {...user} />} */}
    </Styled.Navigation>
  )
}

const Item = ({ icon: Icon, sx, color, ...rest }: NavigationItem, index: number): ReactElement => (
  <Styled.NavItem
    sx={{
      color,
      ...sx
    }}
    {...rest} key={index}>
    {Icon && <Icon />}
  </Styled.NavItem>
)

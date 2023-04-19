/** @jsxImportSource theme-ui */
import type { ComponentType, ReactElement, SVGProps } from 'react'
import type { ThemeUIStyleObject } from 'theme-ui'
import type { Theme } from '@netherite/ds-tokens'

import * as Styled from './Navigation.styles'

export type NavigationItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>,
  title?: string,
  to?: string
  as?: ComponentType<JSX.Element>
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
    <Styled.Navigation className={className}>
      <Styled.NavHeader>
        {brand && <Item {...brand} />}
        {search && <Item {...search} />}
      </Styled.NavHeader>

      <Styled.NavSecondary>
        {inbox && <Item {...inbox} />}
        <Styled.NavPrimary>
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
    key={index}
    sx={{ color, '&.active': { color: colorActive }, ...sx }}
    {...rest}>
    {Icon && <Icon />}
  </Styled.NavItem>
)

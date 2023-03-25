/** @jsxImportSource theme-ui */
import type { ReactElement } from 'react'
import type { ThemeUIStyleObject } from 'theme-ui'

import * as Styled from './Navigation.styles'

export type NavigationItem = {
  icon: any
  title?: string
  to?: string
  className?: string
  sx?: ThemeUIStyleObject
}

export type NavigationProps = {
  className?: string
  brand?: NavigationItem
  search?: NavigationItem
  inbox?: NavigationItem
  primaryOptions?: NavigationItem[]
  secondaryOptions?: NavigationItem[]
}

export const Navigation = ({
  className,
  brand,
  search,
  inbox,
  primaryOptions = [],
  secondaryOptions = []
}: NavigationProps): ReactElement => {
  return (
    <Styled.Navigation className={className} sx={{ bg: 'backgroundDark' }}>
      {brand && <Item {...brand} sx={{ my: 2 }} />}
      {search && <Item {...search} sx={{ mt: 3 }} />}

      <Styled.NavigationSecondary sx={{
          bg: 'shadow',
          py: 3
        }}>

        {inbox && <Item {...inbox} />}

        <Styled.NavigationPrimary sx={{
          bg: 'shadowDark',
          py: 3,
          my: 3,
        }}>
          {primaryOptions.length > 0 && primaryOptions.map(Item)}
        </Styled.NavigationPrimary>

        {secondaryOptions.length > 0 && secondaryOptions.map(Item)}
      </Styled.NavigationSecondary>

      {search && <Item {...search} />}
    </Styled.Navigation>
  )
}

const Item = ({ icon, ...rest }: NavigationItem, index: number): ReactElement => (
  <Styled.Item {...rest} key={index} sx={{ my: 1, color: 'accent' }}>
    {icon}
  </Styled.Item>
)

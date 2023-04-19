/** @jsxImportSource theme-ui */
import type { ComponentPropsWithoutRef, ReactElement } from 'react'
import type { Theme } from '@netherite/ds-tokens'

import * as Styled from './Avatar.styles'

export enum AvatarSizes {
  'small' = 3,
  'medium' = 5,
  'large' = 6,
}

export type AvatarType = Omit<ComponentPropsWithoutRef<'div'>, 'color'> & {
  color?: keyof Theme['colors']
  size: AvatarSizes
}

export const Avatar = ({ children, size, color, ...rest }: AvatarType): ReactElement => {
  return (
    <Styled.Avatar
      children={children}
      sx={{ size, bg: color }}
      {...rest}
    />
  )
}

Avatar.defaultProps = {
  size: AvatarSizes.medium
}

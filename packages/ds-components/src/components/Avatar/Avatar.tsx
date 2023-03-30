/** @jsxImportSource theme-ui */
import type { ComponentPropsWithoutRef, ReactElement } from 'react'
import type { Theme } from '@netherite/ds-tokens'

import * as Styled from './Avatar.styles'

export enum AvatarSizes {
  'small' = 3,
  'medium' = 4,
  'large' = 5,
}

export type AvatarProps = Omit<ComponentPropsWithoutRef<'div'>, 'color'> & {
  color?: keyof Theme['colors']
  size: AvatarSizes
}

export const Avatar = ({ children, size, color, ...rest }: AvatarProps): ReactElement => {
  return (
    <Styled.Avatar
      children={children}
      sx={{
        size,
        bg: color,
        color: 'background',
        fontSize: 2,
        fontWeight: 600
      }}
      {...rest}
    />
  )
}

Avatar.defaultProps = {
  size: AvatarSizes.medium
}

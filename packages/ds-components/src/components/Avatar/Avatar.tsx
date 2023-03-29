/** @jsxImportSource theme-ui */
import type { theme } from '@netherite/ds-tokens'
import type { ReactElement } from 'react'

import * as Styled from './Avatar.styles'

export enum AvatarSizes {
  'small',
  'medium',
  'large'
}

export type AvatarProps = {
  className?: string
  color: keyof typeof theme.colors
  children?: ReactElement
  size: AvatarSizes
}

export const Avatar = ({ className, children, size }: AvatarProps): ReactElement => {
  return (
    <Styled.Avatar
      className={className}
      children={children}
      sx={{
        size
      }}
    />
  )
}

Avatar.defaultProps = {
  size: AvatarSizes.medium
}

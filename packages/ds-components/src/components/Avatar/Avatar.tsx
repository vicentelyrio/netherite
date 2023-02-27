import * as Styled from './Avatar.styles'

import type { ReactElement } from 'react'

type AvatarProps = {
  children: ReactElement
}

export const Avatar = ({ children }: AvatarProps) => {
  return (
    <Styled.Avatar children={children} />
  )
}

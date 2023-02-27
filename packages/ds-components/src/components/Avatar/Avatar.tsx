import * as Styled from './Avatar.styles'

import type { ReactElement } from 'react'

export type AvatarProps = {
  children: ReactElement
}

export const Avatar = ({ children }: AvatarProps): ReactElement => {
  return (
    <Styled.Avatar children={children} />
  )
}

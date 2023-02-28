import type { ReactElement } from 'react'

import * as Styled from './Avatar.styles'

export type AvatarProps = {
  label: string
}

export const Avatar = ({ label }: AvatarProps): ReactElement => {
  return (
    <Styled.Avatar children={label} />
  )
}

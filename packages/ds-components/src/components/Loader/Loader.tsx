import type { ReactElement } from 'react'

import * as Styled from './Loader.styles'

export type LoaderType = {
  className?: string
}

export const Loader = ({ className }: LoaderType): ReactElement => {
  return (
    <Styled.Loader className={className} />
  )
}

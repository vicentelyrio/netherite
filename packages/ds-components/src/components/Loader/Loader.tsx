import type { ReactElement } from 'react'

import * as Styled from './Loader.styles'

type LoaderProps = {
  className?: string
}

export const Loader = ({ className }: LoaderProps): ReactElement => {
  return (
    <Styled.Loader className={className} />
  )
}

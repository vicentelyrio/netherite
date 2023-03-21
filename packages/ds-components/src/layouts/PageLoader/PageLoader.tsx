import type { ReactElement } from 'react'

import * as Styled from './PageLoader.styles'

type PageLoaderProps = {
  className?: string
}

export const PageLoader = ({ className }: PageLoaderProps): ReactElement => {
  return (
    <Styled.Page className={className}>
      <Styled.PageLoader />
    </Styled.Page>
  )
}

import type { ReactElement } from 'react'

import * as Styled from './Page.styles'

export type PageProps = {
  workspace?: ReactElement,
  navigation?: ReactElement,
  className?: string
}

export const Page = ({ className, navigation, workspace }: PageProps): ReactElement => {
  return (
    <Styled.Page className={className}>
      <Styled.Navigation children={navigation} />
      <Styled.Workspace children={workspace} />
    </Styled.Page>
  )
}

import type { ReactElement } from 'react'

import * as Styled from './Workspace.styles'

export type WorkspaceProps = {
  className?: string
  children?: ReactElement,
}

export const Workspace = ({ children, ...rest }: WorkspaceProps): ReactElement => {
  return <Styled.Workspace children={children} {...rest} />
}

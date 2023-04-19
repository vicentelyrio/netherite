/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Grid } from 'theme-ui'

export const Workspace = styled(Grid)({
  minHeight: '100%',
  gridColumn: '2 / -2',
})

Workspace.defaultProps = {
  variant: 'workspace'
}

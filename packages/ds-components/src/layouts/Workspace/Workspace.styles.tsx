import styled from '@emotion/styled'
import { Grid } from 'theme-ui'

export const Workspace = styled(Grid)({
  minHeight: '100%',
  gridColumn: '2 / 22',
})

Workspace.defaultProps = {
  gap: 4,
  columns: 22,
}

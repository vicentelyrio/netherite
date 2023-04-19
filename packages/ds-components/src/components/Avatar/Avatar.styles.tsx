/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Box } from 'theme-ui'

export const Avatar = styled(Box)(
  ({ theme } ) => ({
    borderRadius: '50%',
    textTransform: 'uppercase',
    textAlign: 'center',
    display: 'flex',
    flexFlow: 'column nowrap',
    alignContent: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    color: theme.colors.background,
    fontSize: theme.fontSizes[2],
    fontWeight: theme.fontWeights.bold
  })
)


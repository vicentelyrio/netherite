/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { Box, Grid } from 'theme-ui'

const fadeIn = keyframes({
  from: { opacity: 0 },
  to:   { opacity: 1 }
})

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateX(-100%)' },
  to:   { opacity: 1, transform: 'translateX(0)' }
})

export const Page = styled(Grid)({
  width: '100%',
  height: '100svh',
  overflow: 'hidden',
})

Page.defaultProps = {
  variant: 'page'
}

export const Navigation = styled(Box)({
  height: '100svh',
  gridArea: 'navigation',
  transform: 'translateX(-100%)',
  opacity: 0,
  animation: `${slideIn} 256ms ease-out forwards`,
})

export const Workspace = styled(Grid)({
  gridArea: 'workspace',
  opacity: 0,
  animation: `${fadeIn} 256ms ease-out forwards`,
})

Workspace.defaultProps = {
  variant: 'pageWorkspace'
}


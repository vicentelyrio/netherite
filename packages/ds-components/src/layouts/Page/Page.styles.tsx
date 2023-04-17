import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { Box, Grid } from 'theme-ui'

const NAV_WIDTH = 60

const fadeIn = keyframes({
  from: { opacity: 0 },
  to:   { opacity: 1 }
})

const slideIn = keyframes({
  from: { opacity: 0, transform: `translateX(-${NAV_WIDTH}px)` },
  to:   { opacity: 1, transform: `translateX(0)` }
})

export const Page = styled(Grid)`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  grid-template-areas: "navigation workspace";
  grid-template-columns: ${NAV_WIDTH}px 1fr;
`
Page.defaultProps = { gap: 0 }

export const Navigation = styled(Box)`
  grid-area: navigation;
  transform: translateX(-${NAV_WIDTH}px);
  opacity: 0;
  animation: ${slideIn} 256ms ease-out forwards;
`

export const Workspace = styled(Grid)`
  grid-area: workspace;
  opacity: 0;
  animation: ${fadeIn} 256ms ease-out forwards;
`

Workspace.defaultProps = {
  gap: 4,
  columns: 22,
}


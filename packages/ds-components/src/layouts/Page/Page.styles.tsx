import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const NAV_WIDTH = 60

const fadeIn = keyframes({
  from: { opacity: 0 },
  to:   { opacity: 1 }
})

const slideIn = keyframes({
  from: { opacity: 0, transform: `translateX(-${NAV_WIDTH}px)` },
  to:   { opacity: 1, transform: `translateX(0)` }
})

export const Page = styled.div`
  background: ${({ theme }) => theme?.colors?.background};
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-areas: "navigation workspace";
  grid-template-columns: ${NAV_WIDTH}px 1fr;
`

export const Navigation = styled.nav`
  grid-area: navigation;
  transform: translateX(-${NAV_WIDTH}px);
  opacity: 0;
  animation: ${slideIn} 256ms ease-out forwards;
`

export const Workspace = styled.section`
  grid-area: workspace;
  opacity: 0;
  animation: ${fadeIn} 256ms ease-out forwards;
`

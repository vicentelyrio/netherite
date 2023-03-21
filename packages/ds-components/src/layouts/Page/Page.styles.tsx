import styled from '@emotion/styled'

const NAV_WIDTH = 60

export const Page = styled.div`
  background: ${({ theme }) => theme.colors?.background};
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-areas: "navigation workspace";
  grid-template-columns: ${NAV_WIDTH}px 1fr;
`

export const Navigation = styled.nav`
  grid-area: navigation;
`

export const Workspace = styled.section`
  grid-area: workspace;
`

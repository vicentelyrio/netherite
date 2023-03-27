/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { IconButton } from 'theme-ui'

export const NAV_WIDTH = 40

export const Navigation = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`

export const Item = styled(IconButton)`
  flex: 0 0 auto;
`

export const Icon = styled('div', {
  shouldForwardProp: (props) => props !== 'isActive',
})`
`

const Nav = styled.nav`
  border-radius: ${NAV_WIDTH}px;
  flex: '0 0 auto';
  display: 'flex';
  flex-flow: 'column nowrap';
  margin: auto;
  text-align: center;
`

export const NavigationPrimary = styled(Nav)``

export const NavigationSecondary = styled(Nav)``

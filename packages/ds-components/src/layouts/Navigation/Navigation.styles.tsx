/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Avatar } from 'components/Avatar/Avatar'
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

export const NavItem = styled(IconButton)`
  flex: 0 0 auto;
`

const NavBase = styled.nav`
  border-radius: ${NAV_WIDTH}px;
  flex: '0 0 auto';
  display: 'flex';
  flex-flow: 'column nowrap';
  margin: auto;
  text-align: center;
`

export const NavPrimary = styled(NavBase)``

export const NavSecondary = styled(NavBase)``

export const NavAvatar = styled(Avatar)``


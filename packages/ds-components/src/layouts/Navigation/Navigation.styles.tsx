/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Avatar } from 'components/Avatar/Avatar'
import { Flex, IconButton } from 'theme-ui'

export const Navigation = styled(Flex)({
  width: '100%',
  height: '100svh',
  overflow: 'hidden',
  flexFlow: 'column nowrap',
  alignItems: 'center',
  justifyContent: 'space-between',
})

Navigation.defaultProps = {
  as: 'nav',
  sx: {
    bg: 'backgroundDark',
    py: 3
  }
}

export const NavItem = styled(IconButton)({
  flex: '0 0 auto',
})

NavItem.defaultProps = {
 sx: { my: 1 }
}

export const NavBase = styled(Flex)({
  width: '100%',
  flex: '0 0 auto',
  flexFlow: 'column nowrap',
  alignItems: 'center',
})

export const NavHeader = styled(NavBase)()

NavHeader.defaultProps = {
  sx:{
    '& > a': {
      mb: 5
    }
  }
}

export const NavPrimary = styled(NavBase)()

NavPrimary.defaultProps = {
  sx: {
    bg: 'shadowDark',
    py: 3,
    my: 3,
    borderRadius: 6,
  }
}

export const NavSecondary = styled(NavBase)()

NavSecondary.defaultProps = {
  sx: {
    bg: 'shadow',
    py: 3,
    borderRadius: 6,
  }
}

export const NavAvatar = styled(Avatar)({
  cursor: 'pointer',
  textDecoration: 'none',
  flex: '0 0 auto',
})


/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Flex } from 'theme-ui'

import { IconBrandLogo } from '@netherite/ds-assets'
import { Loader } from 'components/Loader/Loader'

export const Page = styled(Flex)({
  width: '100%',
  height: '100svh',
  overflow: 'hidden',
  flexFlow: 'column nowrap',
  alignItems: 'center',
  justifyContent: 'center',
})

export const PageLoader = styled(Loader)()

export const PageLogo = styled(IconBrandLogo)(
  ({ theme }) => ({
    width: theme.sizes[7],
    marginBottom: theme.space[5],
  })
)

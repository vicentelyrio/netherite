import styled from '@emotion/styled'

import { IconBrandLogo } from '@netherite/ds-assets'
import { Loader } from 'components/Loader/Loader'

export const Page = styled.div`
  background: ${({ theme }) => theme.colors?.background};
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
`

export const PageLoader = styled(Loader)`
`

export const PageLogo = styled(IconBrandLogo)`
  width: 96px;
  margin-bottom: 30px;
`

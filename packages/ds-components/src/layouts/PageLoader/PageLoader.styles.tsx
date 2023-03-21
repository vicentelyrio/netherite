import styled from '@emotion/styled'

import { Loader } from 'components/Loader/Loader'

export const Page = styled.div`
  background: ${({ theme }) => theme.colors?.background};
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const PageLoader = styled(Loader)`
`

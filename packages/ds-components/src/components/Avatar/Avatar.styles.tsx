import styled from '@emotion/styled'

import { theme } from '@netherite/ds-tokens'

console.log(theme)

export const Avatar = styled.div`
  background: ${theme.colors?.accent};
  border-radius: 50%;
  width: 64px;
  height: 64px;
`

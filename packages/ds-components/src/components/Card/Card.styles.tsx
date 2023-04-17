/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Card as CardComponent, Badge, Text } from 'theme-ui'

export const Card = styled(CardComponent)({
  variant: 'primary'
})

export const CardTitle = styled(Text)`
`

CardTitle.defaultProps = {
  variant: 'h5',
  as: 'h4'
}

export const CardSubTitle = styled(Text)({
  variant: 'bodyMedium'
})

CardSubTitle.defaultProps = {
  variant: 'bodyMedium',
  color: 'boxLight',
  as: 'h5'
}

export const CardLabels = styled.div`
`

export const CardBadge = styled(Badge)`
`

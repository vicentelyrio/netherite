/** @jsxImportSource theme-ui */
import styled from '@emotion/styled'
import { Card as CardComponent, Badge, Heading } from 'theme-ui'

export const Card = styled(CardComponent)()

Card.defaultProps = {
  variant: 'primary'
}

export const CardTitle = styled(Heading)`
`

CardTitle.defaultProps = {
  variant: 'h5',
  as: 'h4'
}

export const CardSubTitle = styled(Heading)({
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

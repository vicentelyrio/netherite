import type { ReactElement } from 'react'

import * as Styled from './Card.styles'

export type LabelType = {
  label: string
  path: string
}

export type LinkType = {
  children?: ReactElement
  to?: string
  title?: string
}

export type CardType = {
  title?: string
  subtitle?: string
  labels?: LabelType[]
  to?: string
  link?: any
}

export const Card = ({ title, subtitle, labels, link: Link, to }: CardType): ReactElement => {
  return (
    <Styled.Card>
      <Link to={to} title={`${subtitle} - ${title}`}>
        {subtitle && <Styled.CardSubTitle>{subtitle}</Styled.CardSubTitle>}
        {title && <Styled.CardTitle>{title}</Styled.CardTitle>}
        {labels && (
          <Styled.CardLabels>
            {labels.map(({ label, path }: LabelType) => (
              <Link to={path} title={label} key={path}>
                <Styled.CardBadge children={label} />
              </Link>
            ))}
          </Styled.CardLabels>
        )}
      </Link>
    </Styled.Card>
  )
}

Card.defaultProps = {
  link: 'a'
}

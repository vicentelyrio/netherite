import type { ComponentType, ReactElement } from 'react'
import { Card, type CardType, type LinkType } from 'components/Card/Card'

import * as Styled from './CardList.styles'

export type CardListType = {
  title: string
  description: string
  list: CardType[]
  link?: ComponentType<LinkType>
}

export const CardList = (props: CardListType): ReactElement => {
  const { title, description, list, link } = props

  return (
    <Styled.CardList>
      <Styled.Header>
        <Styled.Title>{title}</Styled.Title>
        <Styled.Description>{description}</Styled.Description>
      </Styled.Header>
      {list?.map((item, key) => <Card {...item} key={key} link={link} />)}
    </Styled.CardList>
  )
}


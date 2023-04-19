import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { Link } from '@tanstack/react-location'

import { CardList, Workspace, type CardType } from '@netherite/ds-components'
import type { Goal } from '@netherite/api'
import { GET_GOALS_BY_TYPE } from 'api/Goals/query'

export const Goals = () => {
  const { goals } = useGoals()

  return (
    <Workspace>
      <>
        {goals?.map(({ title, description, goals }, key) => (
          <CardList
            key={key}
            title={title}
            description={description}
            list={goals}
            link={Link}
          />
        ))}
      </>
    </Workspace>
  )
}

const useGoals = () => {
  const { data, loading } = useQuery(GET_GOALS_BY_TYPE)
  const { goalsByType } = data ?? {}

  const goals = useMemo(() => (
    goalsByType?.map(({ goals = [], type, typeSlug = 'nd' }) => ({
      title: type?.name,
      description: type?.description,
      goals: goals.map(({ name, description, slug }: Goal): Omit<CardType, 'link'> => ({
        title: name,
        subtitle: description,
        to: `/goals/${typeSlug}/${slug}`
      }))
    }))
  ), [goalsByType])

  return {
    goals,
    loading,
  }
}

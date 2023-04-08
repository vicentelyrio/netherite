import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { Link, useMatch } from '@tanstack/react-location'

import { GET_GOALS_BY_TYPE } from 'api/Goals/query'
import type { Goal } from '@netherite/api'

export const Goals = () => {
  const { goals, loading } = useGoals()
  const { params } = useMatch()
  console.log(params)

  return (
    <div>
      {Object.entries(goals).map(([key, value = []]) => (
        <div key={key}>
          <h4>{key}</h4>
          <div>
            {value?.map(({ name, description, slug, typeSlug }: Goal) => (
              <Link key={name} to={`/goals/${typeSlug}/${slug}`}>
                <h5>{name}</h5>
                <p>{description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const useGoals = () => {
  const { data, loading } = useQuery(GET_GOALS_BY_TYPE)
  const { goalsByType } = data ?? {}

  const goals = useMemo(() => (
    goalsByType?.reduce((acc, cur) => {
      const { goals = [], typeSlug = 'nd' } = cur ?? {}
      return {
        ...acc,
        [typeSlug]: goals
      }
    }, {}) ?? {}
  ), [goalsByType])

  return {
    goals,
    loading,
  }
}

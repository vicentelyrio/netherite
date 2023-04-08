import { gql, type TypedDocumentNode } from '@apollo/client'
import type { Goal, GoalsByType } from '@netherite/api'

export const GOAL_COMPLETE = gql`
  fragment GoalComplete on Goal {
    type {
      identifier
      name
      slug
    }
    typeSlug
    slug
    raw
    name
    identifier
    description
    projects {
      description
      identifier
      name
      slug
    }
  }
`

export const GOAL_BASE = gql`
  fragment GoalBase on Goal {
    typeSlug
    slug
    raw
    name
    identifier
    description
  }
`

export const GET_GOAL_BY_NAME: TypedDocumentNode<Goal, string> = gql`
  ${GOAL_COMPLETE}
  query GetGoalByName($name: String!) {
    goalByName(name: $name) {
      ...GoalComplete
    }
  }
`

export const GET_GOALS: TypedDocumentNode<Goal[]> = gql`
  ${GOAL_COMPLETE}
  query GetGoals {
    goals {
      ...GoalComplete
    }
  }
`

export const GET_GOALS_BY_TYPE: TypedDocumentNode<{ goalsByType: GoalsByType[] }> = gql`
  ${GOAL_COMPLETE}
  query GetGoalsByType {
    goalsByType {
      typeSlug
      goals {
        ...GoalComplete
      }
    }
  }
`


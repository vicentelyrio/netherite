import { Unavailable } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { decisionsQuery, knowledgeQuery, projectsQuery } from '@/infrastructure/query'
import { type Lane, lanesOf } from '../lanes'

export interface DecisionState {
  readonly all: ReadonlyArray<Lane>
  readonly lanes: ReadonlyArray<Lane>
  readonly project: string
  readonly setProject: (project: string) => void
  readonly noGit: boolean
  readonly partial: boolean
}

const Context = createContext<DecisionState | undefined>(undefined)

export const useDecisions = (): DecisionState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useDecisions needs a DecisionProvider')
  return value
}

export function DecisionProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const knowledge = useQuery(knowledgeQuery(api))
  const decisions = useQuery(decisionsQuery(api))
  const projects = useQuery(projectsQuery(api))
  const [project, setProject] = useState('')

  if (knowledge.isPending || decisions.isPending) {
    return <div className="app-page app-muted">{LL.common.loading()}</div>
  }
  if (knowledge.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title={LL.decisions.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </div>
    )
  }
  const transitions = decisions.data?.transitions ?? []
  const titles = new Map((projects.data?.projects ?? []).map((p) => [p.id, p.title]))
  const value: DecisionState = {
    all: lanesOf(knowledge.data.items, transitions, '', titles),
    lanes: lanesOf(knowledge.data.items, transitions, project, titles),
    project,
    setProject,
    noGit: decisions.isError && decisions.error instanceof Unavailable,
    partial: decisions.data?.partial ?? false,
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

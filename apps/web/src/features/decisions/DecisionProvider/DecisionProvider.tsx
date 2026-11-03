import { Unavailable } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { decisionsQuery, knowledgeQuery } from '@/infrastructure/query'
import { type Lane, lanesOf } from '../lanes'

export interface DecisionState {
  /** Every lane, whatever project is picked: they are the choices of the project filter. */
  readonly all: ReadonlyArray<Lane>
  /** The lanes for the project picked, or all of them. */
  readonly lanes: ReadonlyArray<Lane>
  readonly project: string
  readonly setProject: (project: string) => void
  /** There is no git history to read status changes from. */
  readonly noGit: boolean
  /** The history is cut short (a shallow clone). */
  readonly partial: boolean
}

const Context = createContext<DecisionState | undefined>(undefined)

export const useDecisions = (): DecisionState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useDecisions needs a DecisionProvider')
  return value
}

/** Loads the ADRs and their status changes and holds the project filter. */
export function DecisionProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const knowledge = useQuery(knowledgeQuery(api))
  const decisions = useQuery(decisionsQuery(api))
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
  const value: DecisionState = {
    all: lanesOf(knowledge.data.items, transitions),
    lanes: lanesOf(knowledge.data.items, transitions, project),
    project,
    setProject,
    noGit: decisions.isError && decisions.error instanceof Unavailable,
    partial: decisions.data?.partial ?? false,
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

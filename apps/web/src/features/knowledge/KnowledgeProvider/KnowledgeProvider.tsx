import type { KnowledgeRow } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { knowledgeQuery, useWrite } from '@/infrastructure/query'
import { type Filters, filterKnowledge, noFilters, typeCounts } from '../filters'

export type KnowledgeType = 'doc' | 'adr' | 'context' | 'runbook'

export interface KnowledgeIndexState {
  readonly rows: ReadonlyArray<KnowledgeRow>
  readonly shown: ReadonlyArray<KnowledgeRow>
  readonly filters: Filters
  readonly set: (patch: Partial<Filters>) => void
  readonly clear: () => void
  readonly counts: Readonly<Record<string, number>>
  /** The row whose preview is open: the one picked, or the first shown. */
  readonly current: KnowledgeRow | undefined
  readonly select: (id: string) => void
  /** The type being created, while its title is asked for. */
  readonly creating: KnowledgeType | undefined
  readonly startCreating: (type: KnowledgeType | undefined) => void
  readonly create: (type: KnowledgeType, title: string) => void
}

const Context = createContext<KnowledgeIndexState | undefined>(undefined)

export const useKnowledgeIndex = (): KnowledgeIndexState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useKnowledgeIndex needs a KnowledgeProvider')
  return value
}

/**
 * Loads all knowledge and holds what the index screen shares: the filters, the row picked, and the
 * title being asked for. Shows the loading and error states instead of its children.
 */
export function KnowledgeProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(knowledgeQuery(api))
  const [filters, setFilters] = useState<Filters>(noFilters)
  const [selected, setSelected] = useState<string | undefined>()
  const [creating, setCreating] = useState<KnowledgeType | undefined>()
  const createItem = useWrite(api, (a, v: { type: KnowledgeType; title: string }) =>
    a.call((c) => c.items.create({ payload: v })),
  )
  const rows = query.data?.items
  const value = useMemo<KnowledgeIndexState | undefined>(() => {
    if (rows === undefined) return undefined
    const shown = filterKnowledge(rows, filters)
    return {
      rows,
      shown,
      filters,
      set: (patch) => setFilters({ ...filters, ...patch }),
      clear: () => setFilters(noFilters),
      counts: typeCounts(rows, filters),
      current: shown.find((r) => r.id === selected) ?? shown[0],
      select: setSelected,
      creating,
      startCreating: setCreating,
      create: (type, title) =>
        createItem.mutate({ type, title }, { onSuccess: () => setCreating(undefined) }),
    }
  }, [rows, filters, selected, creating, createItem])

  if (query.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (query.isError || value === undefined) {
    return (
      <div className="app-page">
        <Banner variant="danger" title={LL.knowledge.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </div>
    )
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

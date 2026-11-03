import type { TagUse } from '@netherite/api'
import { Banner } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { tagsQuery } from '@/infrastructure/query'
import { type FieldFilter, filterTags } from '../rules'

export interface TagsState {
  readonly all: ReadonlyArray<TagUse>
  readonly shown: ReadonlyArray<TagUse>
  readonly field: FieldFilter
  readonly setField: (field: FieldFilter) => void
  readonly q: string
  readonly setQ: (q: string) => void
  /** How many tags the kind tab would show. */
  readonly count: (field: FieldFilter) => number
}

const Context = createContext<TagsState | undefined>(undefined)

export const useTags = (): TagsState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useTags needs a TagsProvider')
  return value
}

/** Loads every tag and holds the filters; shows loading and error instead of its children. */
export function TagsProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(tagsQuery(api))
  const [field, setField] = useState<FieldFilter>('all')
  const [q, setQ] = useState('')

  if (query.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title={LL.tags.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </div>
    )
  }
  const all = query.data.tags
  const value: TagsState = {
    all,
    shown: filterTags(all, field, q),
    field,
    setField,
    q,
    setQ,
    count: (f) => (f === 'all' ? all.length : all.filter((t) => t.field === f).length),
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

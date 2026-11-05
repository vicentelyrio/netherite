import { Banner } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { tagMapQuery } from '@/infrastructure/query'
import { type FieldFilter, filterTags, keyOf, pairKey, type TagNode, type TagPair } from '../rules'

export type TagsView = 'map' | 'list'

export interface TagsState {
  readonly all: ReadonlyArray<TagNode>
  readonly shown: ReadonlyArray<TagNode>
  readonly edges: ReadonlyArray<{ readonly a: string; readonly b: string; readonly count: number }>
  readonly duplicates: ReadonlyArray<TagPair>
  readonly keepBoth: (pair: TagPair) => void
  readonly view: TagsView
  readonly setView: (view: TagsView) => void
  readonly selected: TagNode | undefined
  readonly select: (key: string | undefined) => void
  readonly field: FieldFilter
  readonly setField: (field: FieldFilter) => void
  readonly q: string
  readonly setQ: (q: string) => void
  readonly count: (field: FieldFilter) => number
}

const Context = createContext<TagsState | undefined>(undefined)

export const useTags = (): TagsState => {
  const value = useContext(Context)
  if (value === undefined) throw new Error('useTags needs a TagsProvider')
  return value
}

export function TagsProvider({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(tagMapQuery(api))
  const [view, setView] = useState<TagsView>('map')
  const [field, setField] = useState<FieldFilter>('all')
  const [q, setQ] = useState('')
  const [selectedKey, select] = useState<string | undefined>(undefined)
  const [kept, setKept] = useState<ReadonlySet<string>>(new Set())

  const data = query.data
  const value = useMemo<TagsState | undefined>(() => {
    if (data === undefined) return undefined
    const all = data.tags
    return {
      all,
      shown: filterTags(all, field, q),
      edges: data.edges.map((e) => ({ a: keyOf(e.a), b: keyOf(e.b), count: e.count })),
      duplicates: data.duplicates.filter((d) => !kept.has(pairKey(d))),
      keepBoth: (pair) => setKept((current) => new Set(current).add(pairKey(pair))),
      view,
      setView,
      selected: all.find((t) => keyOf(t) === selectedKey),
      select,
      field,
      setField,
      q,
      setQ,
      count: (f) => (f === 'all' ? all.length : all.filter((t) => t.field === f).length),
    }
  }, [data, field, q, view, selectedKey, kept])

  if (query.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (query.isError || value === undefined) {
    return (
      <div className="app-page">
        <Banner variant="danger" title={LL.tags.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </div>
    )
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

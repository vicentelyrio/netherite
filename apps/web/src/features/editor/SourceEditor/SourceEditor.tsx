import { Banner } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useMemo } from 'react'
import { ItemEditor, type ItemEditorProps } from '@/editor/ItemEditor'
import { useApi } from '@/infrastructure/api'
import { useNotices } from '@/infrastructure/notices'
import { itemsQuery, keys, noticeFor, sourceQuery } from '@/infrastructure/query'

/** The source editor for an item, wired to the server: saving, linting and the items to link to. */
export function SourceEditor({
  id,
  fallback,
  ...extra
}: { readonly id: string; readonly fallback?: ReactNode } & Partial<
  Pick<ItemEditorProps, 'variant' | 'preview' | 'mode' | 'onModeChange' | 'onStats' | 'branch'>
>) {
  const api = useApi()
  const client = useQueryClient()
  const notices = useNotices()
  const source = useQuery(sourceQuery(api, id))
  const items = useQuery(itemsQuery(api, { limit: 500 }))
  const targets = useMemo(
    () => (items.data?.items ?? []).map((i) => ({ id: i.id, title: i.title, type: i.type })),
    [items.data],
  )

  if (source.isPending) return fallback ?? <p className="app-muted">Loading the source…</p>
  if (source.isError) return <Banner variant="danger" title="Could not load the source" />

  return (
    <ItemEditor
      {...extra}
      source={source.data}
      targets={targets}
      lint={async (text) =>
        (await api.call((c) => c.lintText.lintText({ payload: { id, text } }))).diagnostics
      }
      onSave={async (text, baseHash) => {
        try {
          const saved = await api.call((c) =>
            c.items.replaceSource({ params: { id }, payload: { text, baseHash } }),
          )
          void client.invalidateQueries({ queryKey: ['items'] })
          return { text, hash: saved.hash }
        } catch (error) {
          notices.notify(
            noticeFor(error, () => void client.invalidateQueries({ queryKey: keys.source(id) })),
          )
          throw error
        }
      }}
    />
  )
}

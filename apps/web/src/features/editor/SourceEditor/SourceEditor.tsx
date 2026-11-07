import { Banner } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useMemo } from 'react'
import { ItemEditor, type ItemEditorProps } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { itemsQuery, keys, noticeFor, sourceQuery } from '@/infrastructure/query'
import { useEditorSettings, useTheme } from '@/infrastructure/settings'
import { useResolvedShortcuts } from '@/infrastructure/shortcuts'

export function SourceEditor({
  id,
  fallback,
  ...extra
}: { readonly id: string; readonly fallback?: ReactNode } & Partial<
  Pick<
    ItemEditorProps,
    'variant' | 'preview' | 'mode' | 'onModeChange' | 'onStats' | 'branch' | 'onReady'
  >
>) {
  const { LL } = useI18nContext()
  const api = useApi()
  const client = useQueryClient()
  const notices = useNotices()
  const source = useQuery(sourceQuery(api, id))
  const saveKeys = useResolvedShortcuts()['editor.save'].keys
  const { vimMode, autosaveDelayMs } = useEditorSettings()
  const { theme } = useTheme()
  const items = useQuery(itemsQuery(api, { limit: 500 }))
  const targets = useMemo(
    () => (items.data?.items ?? []).map((i) => ({ id: i.id, title: i.title, type: i.type })),
    [items.data],
  )

  if (source.isPending) return fallback ?? <p className="app-muted">{LL.editor.loading()}</p>
  if (source.isError) return <Banner variant="danger" title={LL.editor.loadError()} />

  return (
    <ItemEditor
      {...extra}
      source={source.data}
      saveKeys={saveKeys}
      vimMode={vimMode}
      dark={theme.scheme === 'dark'}
      autosaveDelay={autosaveDelayMs}
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
            noticeFor(
              LL,
              error,
              () => void client.invalidateQueries({ queryKey: keys.source(id) }),
            ),
          )
          throw error
        }
      }}
    />
  )
}

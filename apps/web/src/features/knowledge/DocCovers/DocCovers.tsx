import type { ItemDetail } from '@netherite/api'
import { ActionIcon, Button, Icon } from '@netherite/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'

export function DocCovers({
  item,
  covers,
}: {
  readonly item: ItemDetail
  readonly covers: ReadonlyArray<string>
}) {
  const { LL } = useI18nContext()
  const text = LL.knowledge.doc.panel
  const api = useApi()
  const client = useQueryClient()
  const [adding, setAdding] = useState(false)
  const save = useWrite(
    api,
    (a, next: ReadonlyArray<string>) =>
      a.call((c) =>
        c.items.update({
          params: { id: item.id },
          payload: {
            ...(next.length === 0 ? { unset: ['covers'] } : { set: { covers: next } }),
            baseHash: item.hash,
          },
        }),
      ),
    { reload: () => void client.invalidateQueries() },
  )
  const add = (typed: string) => {
    const path = typed.replace(/^\.\//, '')
    if (covers.includes(path)) setAdding(false)
    else save.mutate([...covers, path], { onSuccess: () => setAdding(false) })
  }
  return (
    <section className="kf-section">
      <h2 className="kf-h">
        <Icon name="folder_code" size={15} /> {text.covers({ count: covers.length })}
      </h2>
      {covers.map((path) => (
        <div key={path} className="kn-file-row">
          <span className="kn-mono">{path}</span>
          <ActionIcon
            icon="close"
            label={text.uncover({ path })}
            variant="subtle"
            color="gray"
            size="sm"
            disabled={save.isPending}
            onClick={() => save.mutate(covers.filter((c) => c !== path))}
          />
        </div>
      ))}
      {covers.length === 0 && !adding && <p className="app-muted">{text.coversHint()}</p>}
      {adding ? (
        <TitleForm
          label={text.coverLabel()}
          pending={save.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={add}
        />
      ) : (
        <Button size="sm" icon="add" onClick={() => setAdding(true)}>
          {text.addCover()}
        </Button>
      )}
    </section>
  )
}

import type { TagUse } from '@netherite/api'
import { Button } from '@netherite/ui'
import { type FormEvent, useState } from 'react'
import { TextField } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { renameOutcome } from '../rules'
import './RenameForm.css'

export function RenameForm({
  tag,
  tags,
  onDone,
}: {
  readonly tag: TagUse
  readonly tags: ReadonlyArray<TagUse>
  readonly onDone: () => void
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const notices = useNotices()
  const [name, setName] = useState(tag.name)
  const rename = useWrite(api, (a, to: string) =>
    a.call((c) => c.tags.rename({ payload: { field: tag.field, from: tag.name, to } })),
  )
  const outcome = renameOutcome(tags, tag, name)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (outcome === 'same' || outcome === 'empty' || outcome === 'spaces') return
    rename.mutate(name.trim(), {
      onSuccess: (r) => {
        notices.notify({
          variant: 'success',
          title: LL.tags.renamed({ name: name.trim() }),
          text: LL.tags.changedIn({ count: r.renamed }),
        })
        onDone()
      },
    })
  }
  return (
    <form
      className="tg-rename"
      onSubmit={submit}
      aria-label={LL.tags.renameLabel({ name: tag.name })}
    >
      <TextField
        label={LL.tags.newName({ name: tag.name })}
        value={name}
        onChange={setName}
        onEscape={onDone}
        autoFocus
      />
      <Button
        variant="primary"
        type="submit"
        disabled={outcome === 'same' || outcome === 'empty' || outcome === 'spaces'}
        loading={rename.isPending}
      >
        {outcome === 'merge' ? LL.tags.merge() : LL.tags.rename()}
      </Button>
      {outcome in LL.tags.messages && (
        <span className="app-muted">
          {LL.tags.messages[outcome as 'empty' | 'spaces' | 'merge']()}
        </span>
      )}
    </form>
  )
}

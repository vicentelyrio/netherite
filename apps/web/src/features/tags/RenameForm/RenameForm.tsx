import type { TagUse } from '@netherite/api'
import { Button } from '@netherite/ui'
import { type FormEvent, useState } from 'react'
import { TextField } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { renameOutcome } from '../rules'
import './RenameForm.css'

const messages = {
  empty: 'A tag needs a name',
  spaces: 'A tag cannot contain spaces',
  same: '',
  merge: 'That name is in use: the two will merge',
  rename: '',
} as const

/** Renames a tag everywhere at once; a name already in use merges the two. */
export function RenameForm({
  tag,
  tags,
  onDone,
}: {
  readonly tag: TagUse
  readonly tags: ReadonlyArray<TagUse>
  readonly onDone: () => void
}) {
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
          title: `Renamed to ${name.trim()}`,
          text: `Changed in ${r.renamed} ${r.renamed === 1 ? 'file' : 'files'}.`,
        })
        onDone()
      },
    })
  }
  return (
    <form className="tg-rename" onSubmit={submit} aria-label={`Rename ${tag.name}`}>
      <TextField
        label={`New name for ${tag.name}`}
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
        {outcome === 'merge' ? 'Merge' : 'Rename'}
      </Button>
      {messages[outcome] && <span className="app-muted">{messages[outcome]}</span>}
    </form>
  )
}

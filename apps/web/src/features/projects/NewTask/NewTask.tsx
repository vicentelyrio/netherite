import { Icon } from '@netherite/ui'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import { useActionShortcuts, useShortcutHint } from '@/infrastructure/shortcuts'

export function NewTask({
  projectId,
  state,
  first,
}: {
  readonly projectId: string
  readonly state: string
  readonly first: boolean
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [adding, setAdding] = useState(false)
  useActionShortcuts({ 'board.new': () => setAdding(true) }, { enabled: first && !adding })
  const hint = useShortcutHint('board.new')
  const create = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({ payload: { type: 'task', title, fields: { project: projectId, state } } }),
    ),
  )
  return adding ? (
    <TitleForm
      label={LL.projects.newTaskIn({ state })}
      pending={create.isPending}
      onCancel={() => setAdding(false)}
      onSubmit={(title) => create.mutate(title, { onSuccess: () => setAdding(false) })}
    />
  ) : (
    <button
      type="button"
      className="board-new"
      title={first ? hint : undefined}
      onClick={() => setAdding(true)}
    >
      <Icon name="add" /> {LL.projects.newTask()}
    </button>
  )
}

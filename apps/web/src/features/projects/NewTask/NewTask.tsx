import { Icon } from '@netherite/ui'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'

export function NewTask({
  projectId,
  state,
}: {
  readonly projectId: string
  readonly state: string
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [adding, setAdding] = useState(false)
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
    <button type="button" className="board-new" onClick={() => setAdding(true)}>
      <Icon name="add" /> {LL.projects.newTask()}
    </button>
  )
}

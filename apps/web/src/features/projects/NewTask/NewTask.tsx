import { Icon } from '@netherite/ui'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useWrite } from '@/infrastructure/query'

/** Adds a task to a column: a button that opens a title form. */
export function NewTask({
  projectId,
  state,
}: {
  readonly projectId: string
  readonly state: string
}) {
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const create = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({ payload: { type: 'task', title, fields: { project: projectId, state } } }),
    ),
  )
  return adding ? (
    <TitleForm
      label={`New ${state} task`}
      onCancel={() => setAdding(false)}
      onSubmit={(title) => create.mutate(title, { onSuccess: () => setAdding(false) })}
    />
  ) : (
    <button type="button" className="board-new" onClick={() => setAdding(true)}>
      <Icon name="add" /> New task
    </button>
  )
}

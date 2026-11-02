import { Icon } from '@netherite/ui'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useWrite } from '@/infrastructure/query'
import './NewGoal.css'

/** A dashed button that opens a title form and creates a goal, in an area when it has one. */
export function NewGoal({ area }: { readonly area: string | undefined }) {
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const create = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({
        payload: { type: 'goal', title, ...(area ? { fields: { area } } : {}) },
      }),
    ),
  )
  return adding ? (
    <TitleForm
      label="Goal title"
      onCancel={() => setAdding(false)}
      onSubmit={(title) => create.mutate(title, { onSuccess: () => setAdding(false) })}
    />
  ) : (
    <button type="button" className="goals-new" onClick={() => setAdding(true)}>
      <Icon name="add" /> New goal
    </button>
  )
}

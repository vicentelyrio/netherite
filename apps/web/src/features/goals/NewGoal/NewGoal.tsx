import { Button, Icon } from '@netherite/ui'
import { useState } from 'react'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import './NewGoal.css'

export function NewGoal({
  area,
  compact = false,
}: {
  readonly area: string | undefined
  readonly compact?: boolean
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const create = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({
        payload: { type: 'goal', title, ...(area ? { fields: { area } } : {}) },
      }),
    ),
  )
  if (adding) {
    const form = (
      <TitleForm
        label={LL.goals.goalTitle()}
        pending={create.isPending}
        onCancel={() => setAdding(false)}
        onSubmit={(title) => create.mutate(title, { onSuccess: () => setAdding(false) })}
      />
    )
    return compact ? <div className="goals-new-form">{form}</div> : form
  }
  return compact ? (
    <Button icon="add" variant="primary" onClick={() => setAdding(true)}>
      {LL.goals.newGoal()}
    </Button>
  ) : (
    <button type="button" className="goals-new" onClick={() => setAdding(true)}>
      <Icon name="add" /> {LL.goals.newGoal()}
    </button>
  )
}

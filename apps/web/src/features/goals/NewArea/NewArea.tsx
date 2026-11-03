import { Button, Icon } from '@netherite/ui'
import { type FormEvent, useState } from 'react'
import { TextField } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import '../NewGoal/NewGoal.css'
import './NewArea.css'

/**
 * An area exists because a goal names it, so a new area starts with its first goal: the form asks
 * for both. Areas already in use are offered so a typo does not make a second one.
 */
export function NewArea({ areas }: { readonly areas: ReadonlyArray<string> }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const [area, setArea] = useState('')
  const [title, setTitle] = useState('')
  const create = useWrite(api, (a, v: { area: string; title: string }) =>
    a.call((c) =>
      c.items.create({ payload: { type: 'goal', title: v.title, fields: { area: v.area } } }),
    ),
  )
  const clash = areas.some((a) => a.toLowerCase() === area.trim().toLowerCase())
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (area.trim() === '' || title.trim() === '') return
    create.mutate(
      { area: area.trim(), title: title.trim() },
      {
        onSuccess: () => {
          setAdding(false)
          setArea('')
          setTitle('')
        },
      },
    )
  }
  if (!adding) {
    return (
      <button type="button" className="goals-new goals-new-area" onClick={() => setAdding(true)}>
        <Icon name="add" /> {LL.goals.newArea()}
      </button>
    )
  }
  return (
    <form className="goals-area-form" onSubmit={submit} aria-label={LL.goals.newArea()}>
      <TextField
        label={LL.goals.areaName()}
        placeholder={LL.goals.areaName()}
        value={area}
        onChange={setArea}
        onEscape={() => setAdding(false)}
        autoFocus
      />
      {clash && <span className="app-muted">{LL.goals.areaExists()}</span>}
      <TextField
        label={LL.goals.firstGoal()}
        placeholder={LL.goals.firstGoal()}
        value={title}
        onChange={setTitle}
        onEscape={() => setAdding(false)}
      />
      <Button variant="primary" type="submit">
        {LL.goals.createArea()}
      </Button>
    </form>
  )
}

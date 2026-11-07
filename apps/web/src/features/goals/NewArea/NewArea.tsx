import { type FocusEvent, type KeyboardEvent, useState } from 'react'
import { TextField } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import { NewItemButton } from '../NewItemButton'
import './NewArea.css'

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
  const name = area.trim()
  const goal = title.trim()
  const clash = areas.some((a) => a.toLowerCase() === name.toLowerCase())
  const close = () => {
    setAdding(false)
    setArea('')
    setTitle('')
  }
  const accept = () => {
    if (create.isPending) return
    if (name === '' && goal === '') close()
    else if (name !== '' && goal !== '') {
      create.mutate({ area: name, title: goal }, { onSuccess: close })
    }
  }
  const enter = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if ((name === '') === (goal === '')) accept()
    else (e.currentTarget.elements[name === '' ? 0 : 1] as HTMLInputElement).focus()
  }
  const blur = (e: FocusEvent<HTMLFormElement>) => {
    if (e.currentTarget.contains(e.relatedTarget)) return
    // Switching window or tab blurs the field but leaves it active: half-typed text must survive.
    if (document.activeElement !== e.target) accept()
  }
  if (!adding) {
    return (
      <NewItemButton className="goals-new-area" onClick={() => setAdding(true)}>
        {LL.goals.newArea()}
      </NewItemButton>
    )
  }
  return (
    <form
      className="goals-area-form"
      onKeyDown={enter}
      onBlur={blur}
      aria-label={LL.goals.newArea()}
    >
      <TextField
        className="goals-area-field"
        label={LL.goals.areaName()}
        placeholder={LL.goals.areaName()}
        value={area}
        onChange={setArea}
        onEscape={close}
        autoFocus
      />
      {clash && <span className="app-muted">{LL.goals.areaExists()}</span>}
      <TextField
        className="goals-area-field"
        label={LL.goals.firstGoal()}
        placeholder={LL.goals.firstGoal()}
        value={title}
        onChange={setTitle}
        onEscape={close}
      />
    </form>
  )
}

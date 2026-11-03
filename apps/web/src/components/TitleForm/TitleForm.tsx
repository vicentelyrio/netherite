import { Button } from '@netherite/ui'
import { type FormEvent, useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { TextField } from '../TextField'
import './TitleForm.css'

export interface TitleFormProps {
  readonly label: string
  readonly onSubmit: (title: string) => void
  readonly onCancel: () => void
}

/** Asks for a title in place, then hands it over. Escape or an empty title cancels. */
export function TitleForm({ label, onSubmit, onCancel }: TitleFormProps) {
  const { LL } = useI18nContext()
  const [title, setTitle] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') return
    onSubmit(trimmed)
  }
  return (
    <form className="title-form" onSubmit={submit}>
      <TextField
        label={label}
        placeholder={label}
        value={title}
        onChange={setTitle}
        onEscape={onCancel}
        autoFocus
      />
      <Button variant="primary" type="submit">
        {LL.components.createTitle()}
      </Button>
    </form>
  )
}

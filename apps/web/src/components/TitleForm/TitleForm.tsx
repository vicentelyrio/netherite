import { Button } from '@netherite/ui'
import { type FormEvent, useState } from 'react'
import { TextField } from '../TextField'
import './TitleForm.css'

export interface TitleFormProps {
  readonly label: string
  readonly onSubmit: (title: string) => void
  readonly onCancel: () => void
}

/** Asks for a title in place, then hands it over. Escape or an empty title cancels. */
export function TitleForm({ label, onSubmit, onCancel }: TitleFormProps) {
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
        Create
      </Button>
    </form>
  )
}

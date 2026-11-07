import { type FocusEvent, type FormEvent, useState } from 'react'
import { TextField } from '../TextField'
import './TitleForm.css'

export interface TitleFormProps {
  readonly label: string
  readonly onSubmit: (title: string) => void
  readonly onCancel: () => void
  readonly onEmpty?: () => void
  readonly pending?: boolean
  readonly className?: string
  readonly fieldClassName?: string
}

export function TitleForm({
  label,
  onSubmit,
  onCancel,
  onEmpty = onCancel,
  pending = false,
  className,
  fieldClassName,
}: TitleFormProps) {
  const [title, setTitle] = useState('')
  const accept = () => {
    if (pending) return
    const trimmed = title.trim()
    if (trimmed === '') onEmpty()
    else onSubmit(trimmed)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    accept()
  }
  const blur = (e: FocusEvent<HTMLFormElement>) => {
    // Switching window or tab blurs the field but leaves it active: a half-typed title must survive.
    if (document.activeElement !== e.target) accept()
  }
  return (
    <form
      className={className === undefined ? 'title-form' : `title-form ${className}`}
      onSubmit={submit}
      onBlur={blur}
    >
      <TextField
        className={fieldClassName ? `title-form-field ${fieldClassName}` : 'title-form-field'}
        label={label}
        placeholder={label}
        value={title}
        onChange={setTitle}
        onEscape={onCancel}
        autoFocus
      />
    </form>
  )
}

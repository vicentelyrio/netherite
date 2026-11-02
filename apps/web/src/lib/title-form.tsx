import { Button } from '@netherite/ui'
import { type FormEvent, useState } from 'react'

/** Asks for a title in place, then hands it over. Escape or an empty title cancels. */
export function TitleForm({
  label,
  onSubmit,
  onCancel,
}: {
  readonly label: string
  readonly onSubmit: (title: string) => void
  readonly onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') return
    onSubmit(trimmed)
  }
  return (
    <form className="goal-title-form" onSubmit={submit}>
      <input
        className="goal-title-input"
        aria-label={label}
        placeholder={label}
        value={title}
        // biome-ignore lint/a11y/noAutofocus: the form appears because the person asked for it
        autoFocus
        onChange={(e) => setTitle(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      />
      <Button variant="primary" type="submit">
        Create
      </Button>
    </form>
  )
}

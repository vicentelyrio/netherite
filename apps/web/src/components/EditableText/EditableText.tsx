import { Icon } from '@netherite/ui'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import './EditableText.css'

export interface EditableTextProps {
  readonly value: string
  /** Saves the new text; only called when it is not empty and differs from `value`. */
  readonly onSave: (value: string) => void
  /** The heading level the text is shown as. */
  readonly as: 'h1' | 'h2'
  readonly className?: string
  /** What the field starts with, when that is not the shown text (a placeholder like "No area"). */
  readonly draft?: string | undefined
}

/** A heading that turns into a field when its pencil is pressed; Enter or leaving saves, Escape cancels. */
export function EditableText({
  value,
  onSave,
  as: Tag,
  className,
  draft: start,
}: EditableTextProps) {
  const { LL } = useI18nContext()
  const [draft, setDraft] = useState<string | undefined>(undefined)
  const finish = (save: boolean) => {
    const next = draft?.trim()
    setDraft(undefined)
    if (save && next !== undefined && next !== '' && next !== value) onSave(next)
  }
  if (draft !== undefined) {
    return (
      <input
        className={`editable-input ${className ?? ''}`}
        aria-label={LL.common.rename({ name: value })}
        value={draft}
        // biome-ignore lint/a11y/noAutofocus: the person just pressed the pencil to type here
        autoFocus
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true)
          if (e.key === 'Escape') finish(false)
        }}
      />
    )
  }
  return (
    <div className="editable">
      <Tag className={className}>{value}</Tag>
      <button
        type="button"
        className="editable-edit"
        aria-label={LL.common.rename({ name: value })}
        onClick={() => setDraft(start ?? value)}
      >
        <Icon name="edit" size="inline" />
      </button>
    </div>
  )
}

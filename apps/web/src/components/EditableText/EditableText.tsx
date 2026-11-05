import { Icon } from '@netherite/ui'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import './EditableText.css'

export interface EditableTextProps {
  readonly value: string
  readonly onSave: (value: string) => void
  readonly as: 'h1' | 'h2'
  readonly className?: string
  readonly draft?: string | undefined
}

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

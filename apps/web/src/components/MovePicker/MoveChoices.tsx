import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { ProgressBar } from '../ProgressBar'
import { TextField } from '../TextField'
import type { MoveGroup } from './MovePicker.types'

export function MoveChoices({
  groups,
  currentLabel,
  onPick,
}: {
  readonly groups: ReadonlyArray<MoveGroup>
  readonly currentLabel: string | undefined
  readonly onPick: (id: string) => void
}) {
  const { LL } = useI18nContext()
  const text = LL.components.movePicker
  const [query, setQuery] = useState('')
  const wanted = query.trim().toLowerCase()
  const shown = groups
    .map((g) => ({
      ...g,
      options: g.options.filter((o) => `${o.id} ${o.title}`.toLowerCase().includes(wanted)),
    }))
    .filter((g) => g.options.length > 0)
  return (
    <div className="move-picker">
      <TextField
        className="move-picker-field"
        label={text.filter()}
        placeholder={text.filter()}
        value={query}
        onChange={setQuery}
        autoFocus
      />
      {shown.length === 0 && <p className="app-muted">{text.none()}</p>}
      {shown.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3 className="move-picker-group">{group.label}</h3>
          {group.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="move-picker-option"
              disabled={option.current}
              onClick={() => onPick(option.id)}
            >
              <span className="move-picker-title">
                <strong>{option.title}</strong>
                {option.current ? (
                  <span className="app-muted move-picker-note">
                    {currentLabel ?? text.current()}
                  </span>
                ) : (
                  option.detail && (
                    <span className="app-muted move-picker-note">{option.detail}</span>
                  )
                )}
              </span>
              {option.progress && (
                <ProgressBar done={option.progress.done} total={option.progress.total} />
              )}
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}

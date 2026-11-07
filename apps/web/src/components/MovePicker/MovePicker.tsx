import { Modal } from '@netherite/ui'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { ProgressBar } from '../ProgressBar'
import { TextField } from '../TextField'
import './MovePicker.css'

export interface MoveOption {
  readonly id: string
  readonly title: string
  readonly detail?: string
  readonly progress?: { readonly done: number; readonly total: number }
  readonly current: boolean
}

export interface MoveGroup {
  readonly label: string
  readonly options: ReadonlyArray<MoveOption>
}

export interface MovePickerProps {
  readonly opened: boolean
  readonly title: string
  readonly groups: ReadonlyArray<MoveGroup>
  readonly currentLabel?: string
  readonly onPick: (id: string) => void
  readonly onClose: () => void
}

function Choices({
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
                  <span className="app-muted">{currentLabel ?? text.current()}</span>
                ) : (
                  option.detail && <span className="app-muted">{option.detail}</span>
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

export function MovePicker({
  opened,
  title,
  groups,
  currentLabel,
  onPick,
  onClose,
}: MovePickerProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={560}
      transitionProps={{ duration: 0 }}
    >
      <Choices
        groups={groups}
        currentLabel={currentLabel}
        onPick={(id) => {
          onClose()
          onPick(id)
        }}
      />
    </Modal>
  )
}

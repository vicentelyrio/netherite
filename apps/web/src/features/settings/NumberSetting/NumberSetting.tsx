import { useEffect, useState } from 'react'
import { SettingRow } from '../SettingRow'
import './NumberSetting.css'

const isAllowed = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max

export function NumberSetting({
  label,
  hint,
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
}: {
  readonly label: string
  readonly hint: string
  readonly value: number
  readonly min?: number
  readonly max?: number
  readonly onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = () => {
    const next = Number(draft)
    if (draft.trim() === '' || !isAllowed(next, min, max)) return setDraft(String(value))
    if (next !== value) onChange(next)
  }
  return (
    <SettingRow label={label} hint={hint}>
      <input
        className="ns-input"
        type="number"
        aria-label={label}
        min={min}
        {...(max === Number.MAX_SAFE_INTEGER ? {} : { max })}
        step={1}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') setDraft(String(value))
        }}
      />
    </SettingRow>
  )
}

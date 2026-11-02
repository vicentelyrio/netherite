import { Icon } from '@netherite/ui'
import './SearchField.css'

export interface SearchFieldProps {
  /** Both the placeholder and the accessible name. */
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
}

/** A text box with a magnifier, for narrowing a list as you type. */
export function SearchField({ label, value, onChange }: SearchFieldProps) {
  return (
    <label className="search-field">
      <Icon name="search" size={18} />
      <input
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    </label>
  )
}

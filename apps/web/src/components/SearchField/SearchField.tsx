import { Icon } from '@netherite/ui'
import './SearchField.css'

export interface SearchFieldProps {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
}

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

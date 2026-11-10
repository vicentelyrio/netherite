import { Icon } from '@netherite/ui'
import type { Ref } from 'react'
import './SearchField.css'

export interface SearchFieldProps {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly inputRef?: Ref<HTMLInputElement>
}

export function SearchField({ label, value, onChange, inputRef }: SearchFieldProps) {
  return (
    <label className="search-field">
      <Icon name="search" size={18} />
      <input
        ref={inputRef}
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    </label>
  )
}

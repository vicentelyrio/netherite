import './SelectField.css'

export interface SelectFieldProps {
  /** Shown before the value and used as the accessible name. */
  readonly label: string
  readonly value: string
  readonly options: ReadonlyArray<string>
  readonly onChange: (value: string) => void
  /** What the empty value is called. */
  readonly anyLabel?: string
}

/** A labelled drop-down with an "Any" choice that stands for no filter (the empty string). */
export function SelectField({
  label,
  value,
  options,
  onChange,
  anyLabel = 'Any',
}: SelectFieldProps) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

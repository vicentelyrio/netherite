import { useI18nContext } from '@/infrastructure/i18n'
import './SelectField.css'

export interface SelectFieldProps {
  readonly label: string
  readonly value: string
  readonly options: ReadonlyArray<string>
  readonly onChange: (value: string) => void
  readonly anyLabel?: string
  readonly labelOf?: (option: string) => string
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  anyLabel,
  labelOf = (option) => option,
}: SelectFieldProps) {
  const { LL } = useI18nContext()
  return (
    <label className="select-field">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        <option value="">{anyLabel ?? LL.common.any()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelOf(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

import './TextField.css'

export interface TextFieldProps {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  readonly autoFocus?: boolean
  readonly onEscape?: () => void
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  onEscape,
}: TextFieldProps) {
  return (
    <input
      className="text-field"
      aria-label={label}
      {...(placeholder === undefined ? {} : { placeholder })}
      value={value}
      // biome-ignore lint/a11y/noAutofocus: callers pass this only for forms the person asked for
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.currentTarget.value)}
      onKeyDown={(e) => e.key === 'Escape' && onEscape?.()}
    />
  )
}

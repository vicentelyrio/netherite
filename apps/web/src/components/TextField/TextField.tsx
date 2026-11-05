import './TextField.css'

export interface TextFieldProps {
  /** The accessible name. */
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  /** Focus the field when it appears; for forms the person just asked for. */
  readonly autoFocus?: boolean
  /** Called when Escape is pressed in the field. */
  readonly onEscape?: () => void
}

/** A single-line text input in the app's style. */
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

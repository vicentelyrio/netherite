import { type ReactNode, useId } from 'react'
import './FilterTabs.css'

export interface FilterOption<T extends string> {
  readonly value: T
  readonly label: ReactNode
  readonly count?: number
  readonly icon?: ReactNode
}

export interface FilterTabsProps<T extends string> {
  readonly label: string
  readonly options: ReadonlyArray<FilterOption<T>>
  readonly value: T
  readonly onChange: (value: T) => void
  readonly variant?: 'segmented' | 'chips'
  readonly className?: string
}

export function FilterTabs<T extends string>({
  label,
  options,
  value,
  onChange,
  variant = 'segmented',
  className,
}: FilterTabsProps<T>) {
  const name = useId()
  return (
    <div
      className={`filter-tabs filter-tabs--${variant}${className ? ` ${className}` : ''}`}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => (
        <label key={option.value} data-on={option.value === value || undefined}>
          <input
            type="radio"
            name={name}
            className="nt-visually-hidden"
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          {option.icon}
          {option.label}
          {option.count !== undefined && (
            <>
              {' '}
              <span className="filter-tabs-count">{option.count}</span>
            </>
          )}
        </label>
      ))}
    </div>
  )
}

import { Select } from '@mantine/core'
import { Icon } from '../Icon'
import {
  defaultWidth,
  maxDropdownHeight,
  minDropdownWidth,
  searchIcon,
} from './SearchSelect.constants'
import type { SearchSelectProps } from './SearchSelect.types'

export function SearchSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  nothingFound,
  width = defaultWidth,
}: SearchSelectProps) {
  return (
    <Select
      aria-label={label}
      placeholder={placeholder}
      data={[...options]}
      value={value ?? null}
      onChange={(next) => onChange(next ?? undefined)}
      searchable
      clearable
      nothingFoundMessage={nothingFound}
      comboboxProps={{ withinPortal: true, width: Math.max(width, minDropdownWidth) }}
      w={width}
      maxDropdownHeight={maxDropdownHeight}
      leftSection={<Icon name={searchIcon} size="inline" />}
    />
  )
}

import { FilterTabs, SearchField } from '@/components'
import { useTags } from '../TagsProvider'

const kinds = [
  ['all', 'All'],
  ['tags', 'Tags'],
  ['labels', 'Labels'],
] as const

/** A text filter and tabs for tags, labels or both. */
export function TagsToolbar() {
  const { all, q, setQ, field, setField, count } = useTags()
  if (all.length === 0) return null
  return (
    <>
      <SearchField label="Filter tags" value={q} onChange={setQ} />
      <FilterTabs
        label="Kind"
        options={kinds.map(([value, label]) => ({ value, label, count: count(value) }))}
        value={field}
        onChange={setField}
      />
    </>
  )
}

import { FilterTabs, SearchField } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useTags } from '../TagsProvider'

const kinds = ['all', 'tags', 'labels'] as const

/** A text filter and tabs for tags, labels or both. */
export function TagsToolbar() {
  const { LL } = useI18nContext()
  const { all, q, setQ, field, setField, count } = useTags()
  if (all.length === 0) return null
  return (
    <>
      <SearchField label={LL.tags.filter()} value={q} onChange={setQ} />
      <FilterTabs
        label={LL.tags.kind()}
        options={kinds.map((value) => ({
          value,
          label: LL.tags.kinds[value](),
          count: count(value),
        }))}
        value={field}
        onChange={setField}
      />
    </>
  )
}

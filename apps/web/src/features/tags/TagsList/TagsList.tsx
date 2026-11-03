import { EmptyState } from '@netherite/ui'
import { GroupCard } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { TagRow } from '../TagRow'
import { useTags } from '../TagsProvider'
import './TagsList.css'

/** Every tag that passes the filters; a prompt to add some when there are none at all. */
export function TagsList() {
  const { LL } = useI18nContext()
  const { all, shown } = useTags()
  if (all.length === 0) {
    return (
      <EmptyState icon="sell" title={LL.tags.empty.title()} description={LL.tags.empty.text()} />
    )
  }
  return (
    <GroupCard label={LL.tags.title()} className="tg-list">
      {shown.map((tag) => (
        <TagRow key={`${tag.field}:${tag.name}`} tag={tag} tags={all} />
      ))}
      {shown.length === 0 && <div className="kn-nomatch">{LL.tags.noMatch()}</div>}
    </GroupCard>
  )
}

import { EmptyState } from '@netherite/ui'
import { GroupCard } from '@/components'
import { TagRow } from '../TagRow'
import { useTags } from '../TagsProvider'
import './TagsList.css'

/** Every tag that passes the filters; a prompt to add some when there are none at all. */
export function TagsList() {
  const { all, shown } = useTags()
  if (all.length === 0) {
    return (
      <EmptyState
        icon="sell"
        title="No tags yet"
        description="Add `tags` to any item, or `labels` to a task or project, and they are counted here."
      />
    )
  }
  return (
    <GroupCard label="Tags" className="tg-list">
      {shown.map((tag) => (
        <TagRow key={`${tag.field}:${tag.name}`} tag={tag} tags={all} />
      ))}
      {shown.length === 0 && <div className="kn-nomatch">No tags match.</div>}
    </GroupCard>
  )
}

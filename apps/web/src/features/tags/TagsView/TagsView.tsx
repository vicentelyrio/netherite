import { NoTags, TagsList } from '../TagsList'
import { TagsMap } from '../TagsMap'
import { useTags } from '../TagsProvider'

/** The map or the list; a prompt to add tags when none exist. */
export function TagsView() {
  const { all, view } = useTags()
  if (all.length === 0) return <NoTags />
  return <div className="tv">{view === 'map' ? <TagsMap /> : <TagsList />}</div>
}

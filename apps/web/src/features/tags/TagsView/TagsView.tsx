import { NoTags } from '../NoTags'
import { TagsList } from '../TagsList'
import { TagsMap } from '../TagsMap'
import { useTags } from '../TagsProvider'

export function TagsView() {
  const { all, view } = useTags()
  if (all.length === 0) return <NoTags />
  return <div className="tv">{view === 'map' ? <TagsMap /> : <TagsList />}</div>
}

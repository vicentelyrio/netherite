import { TagDetail, TagsHeading, TagsProvider, TagsToolbar, TagsView } from '@/features/tags'
import { SplitTemplate } from '@/templates'

/** Tags: a map and a list of every tag and label, what goes with what, and how to merge them. */
export function TagsPage() {
  return (
    <TagsProvider>
      <SplitTemplate
        header={<TagsHeading />}
        toolbar={<TagsToolbar />}
        main={<TagsView />}
        aside={<TagDetail />}
      />
    </TagsProvider>
  )
}

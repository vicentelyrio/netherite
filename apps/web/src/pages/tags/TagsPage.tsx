import {
  DuplicatesButton,
  TagDetail,
  TagsHeading,
  TagsProvider,
  TagsToolbar,
  TagsView,
} from '@/features/tags'
import { SplitTemplate } from '@/templates'

export function TagsPage() {
  return (
    <TagsProvider>
      <SplitTemplate
        header={<TagsHeading />}
        actions={<DuplicatesButton />}
        toolbar={<TagsToolbar />}
        main={<TagsView />}
        aside={<TagDetail />}
      />
    </TagsProvider>
  )
}

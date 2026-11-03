import { TagsHeading, TagsList, TagsProvider, TagsToolbar } from '@/features/tags'
import { PageTemplate } from '@/templates'

/** Tags: every tag and label with how many items carry it, and a way to rename one everywhere. */
export function TagsPage() {
  return (
    <TagsProvider>
      <PageTemplate header={<TagsHeading />} toolbar={<TagsToolbar />}>
        <TagsList />
      </PageTemplate>
    </TagsProvider>
  )
}

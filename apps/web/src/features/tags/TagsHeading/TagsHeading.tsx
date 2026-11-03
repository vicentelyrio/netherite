import { Breadcrumbs } from '@/components'

/** Breadcrumb and title. */
export function TagsHeading() {
  return (
    <div>
      <Breadcrumbs icon="sell">
        <strong>Tags</strong>
      </Breadcrumbs>
      <h1 className="app-title">Tags</h1>
    </div>
  )
}

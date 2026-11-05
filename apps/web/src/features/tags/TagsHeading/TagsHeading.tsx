import { Breadcrumbs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'

/** Breadcrumb and title. */
export function TagsHeading() {
  const { LL } = useI18nContext()
  return (
    <div>
      <Breadcrumbs icon="sell">
        <strong>{LL.tags.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title">{LL.tags.title()}</h1>
    </div>
  )
}

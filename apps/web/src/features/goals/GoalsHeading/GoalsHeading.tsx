import { Breadcrumbs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'

export function GoalsHeading() {
  const { LL } = useI18nContext()
  return (
    <Breadcrumbs>
      <h1 className="breadcrumbs-title">{LL.goals.title()}</h1>
    </Breadcrumbs>
  )
}

import { Breadcrumbs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'

export function ProjectsHeading() {
  const { LL } = useI18nContext()
  return (
    <Breadcrumbs icon="task_alt">
      <h1 className="breadcrumbs-title">{LL.projects.title()}</h1>
    </Breadcrumbs>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalsQuery } from '@/infrastructure/query'
import { groupByArea } from '../GoalAreas/areas'

export function GoalsHeading({ area }: { readonly area?: string | undefined }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(goalsQuery(api))
  const known = groupByArea(query.data?.goals ?? []).some((group) => group.area === area)
  return (
    <Breadcrumbs>
      {known ? (
        <>
          <Link to="/goals">{LL.goals.title()}</Link>
          <span> / </span>
          <h1 className="breadcrumbs-title">{area}</h1>
        </>
      ) : (
        <h1 className="breadcrumbs-title">{LL.goals.title()}</h1>
      )}
    </Breadcrumbs>
  )
}

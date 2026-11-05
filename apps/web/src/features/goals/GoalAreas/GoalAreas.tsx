import { Banner, EmptyState, Grid } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CardColumn } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalsQuery } from '@/infrastructure/query'
import { AreaColumn } from '../AreaColumn'
import { NewArea } from '../NewArea'
import { NewGoal } from '../NewGoal'
import { groupByArea, noArea, sum } from './areas'

export function GoalAreas({ only }: { readonly only?: string }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(goalsQuery(api))

  if (query.isPending) {
    return (
      <Grid.Col span={12}>
        <div className="app-muted">{LL.common.loading()}</div>
      </Grid.Col>
    )
  }
  if (query.isError) {
    return (
      <Grid.Col span={12}>
        <Banner variant="danger" title={LL.goals.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </Grid.Col>
    )
  }
  const all = groupByArea(query.data.goals)
  const some = only === undefined ? all : all.filter((g) => g.area === only)
  const groups = some.length === 0 ? all : some
  if (only !== undefined && some.length > 0) {
    return (
      <>
        {groups.map(({ area, goals }) => (
          <AreaColumn
            key={area}
            area={area}
            goals={goals}
            isUnassigned={area === noArea}
            {...sum(goals)}
          />
        ))}
        <CardColumn>
          <Link to="/goals">{LL.goals.allAreas()}</Link>
        </CardColumn>
      </>
    )
  }
  if (groups.length === 0) {
    return (
      <Grid.Col span={12}>
        <EmptyState
          icon="track_changes"
          title={LL.goals.empty.title()}
          description={LL.goals.empty.text()}
        />
        <NewGoal area={undefined} />
      </Grid.Col>
    )
  }
  return (
    <>
      {groups.map(({ area, goals }) => (
        <AreaColumn
          key={area}
          area={area}
          goals={goals}
          isUnassigned={area === noArea}
          {...sum(goals)}
        />
      ))}
      <CardColumn>
        <NewArea areas={all.map((g) => g.area).filter((a) => a !== noArea)} />
      </CardColumn>
    </>
  )
}

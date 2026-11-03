import { Banner, EmptyState, Grid } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { CardColumn } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalsQuery } from '@/infrastructure/query'
import { AreaColumn } from '../AreaColumn'
import { NewArea } from '../NewArea'
import { NewGoal } from '../NewGoal'
import { groupByArea, noArea, sum } from './areas'

/** Every goal, one column per area, with a way to start a goal or a whole new area. */
export function GoalAreas() {
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
  const groups = groupByArea(query.data.goals)
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
        <NewArea areas={groups.map((g) => g.area).filter((a) => a !== noArea)} />
      </CardColumn>
    </>
  )
}

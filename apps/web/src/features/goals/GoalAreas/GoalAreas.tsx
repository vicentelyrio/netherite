import { DragOverlay } from '@dnd-kit/core'
import { Banner, Card, EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CardColumn, ReorderContext } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalsQuery, useWrite } from '@/infrastructure/query'
import { AreaColumn } from '../AreaColumn'
import { GoalCardBody } from '../GoalCard'
import { NewArea } from '../NewArea'
import { NewGoal } from '../NewGoal'
import { type AreaMove, areaMoveFor, groupByArea, noArea, sum } from './areas'
import './GoalAreas.css'

export function GoalAreas({ only }: { readonly only?: string }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(goalsQuery(api))
  const [draggingId, setDraggingId] = useState<string | undefined>()
  const move = useWrite(api, (a, v: AreaMove) =>
    a.call((c) => c.items.update({ params: { id: v.id }, payload: v.payload })),
  )

  if (query.isPending) {
    return <div className="goal-areas-state app-muted">{LL.common.loading()}</div>
  }
  if (query.isError) {
    return (
      <div className="goal-areas-state">
        <Banner variant="danger" title={LL.goals.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </div>
    )
  }
  const all = groupByArea(query.data.goals)
  const some = only === undefined ? all : all.filter((g) => g.area === only)
  const groups = some.length === 0 ? all : some
  const single = only !== undefined && some.length > 0
  if (!single && groups.length === 0) {
    return (
      <div className="goal-areas-state">
        <EmptyState
          icon="track_changes"
          title={LL.goals.empty.title()}
          description={LL.goals.empty.text()}
          actions={<NewGoal area={undefined} compact />}
        />
      </div>
    )
  }
  const dragging = query.data.goals.find((g) => g.id === draggingId)
  return (
    <ReorderContext
      onStart={setDraggingId}
      onEnd={() => setDraggingId(undefined)}
      onDrop={(id, target) => {
        const change = areaMoveFor(query.data.goals, id, target)
        if (change !== undefined) move.mutate(change)
      }}
    >
      {groups.map(({ area, goals }) => (
        <AreaColumn
          key={area}
          area={area}
          goals={goals}
          isUnassigned={area === noArea}
          dragging={dragging}
          {...sum(goals)}
        />
      ))}
      {!single && (
        <CardColumn>
          <NewArea areas={all.map((g) => g.area).filter((a) => a !== noArea)} />
        </CardColumn>
      )}
      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="goal-overlay">
            <Card>
              <GoalCardBody goal={dragging} />
            </Card>
          </div>
        )}
      </DragOverlay>
    </ReorderContext>
  )
}

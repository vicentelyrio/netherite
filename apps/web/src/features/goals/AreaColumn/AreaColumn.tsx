import type { GoalRow } from '@netherite/api'
import { ProgressRing } from '@netherite/ui'
import { CardColumn } from '@/components'
import { GoalCard } from '../GoalCard'
import { NewGoal } from '../NewGoal'
import './AreaColumn.css'

/** One area: its name and overall progress, its goals, and a way to add another goal. */
export function AreaColumn({
  area,
  goals,
  done,
  total,
  isUnassigned,
}: {
  readonly area: string
  readonly goals: ReadonlyArray<GoalRow>
  readonly done: number
  readonly total: number
  /** The "No area" group: new goals made here get no area. */
  readonly isUnassigned: boolean
}) {
  return (
    <CardColumn label={area}>
      <header className="goals-area-head">
        <h2 className="goals-area-title">{area}</h2>
        <ProgressRing done={done} total={total} size={58} label={area} />
      </header>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
      <NewGoal area={isUnassigned ? undefined : area} />
    </CardColumn>
  )
}

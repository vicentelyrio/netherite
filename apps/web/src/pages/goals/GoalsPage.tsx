import { GoalAreas, GoalsHeading } from '@/features/goals'
import { CardGridTemplate } from '@/templates'

/** Goals: every goal, one column per area. */
export function GoalsPage() {
  return (
    <CardGridTemplate header={<GoalsHeading />}>
      <GoalAreas />
    </CardGridTemplate>
  )
}

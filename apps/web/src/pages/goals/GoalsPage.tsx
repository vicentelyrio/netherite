import { GoalAreas, GoalsHeading } from '@/features/goals'
import { CardGridTemplate } from '@/templates'

/** Goals: every goal, one column per area. */
export function GoalsPage({ area }: { readonly area?: string }) {
  return (
    <CardGridTemplate header={<GoalsHeading />}>
      <GoalAreas {...(area === undefined ? {} : { only: area })} />
    </CardGridTemplate>
  )
}

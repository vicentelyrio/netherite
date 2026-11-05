import { GoalAreas, GoalsHeading } from '@/features/goals'
import { CardGridTemplate } from '@/templates'

export function GoalsPage({ area }: { readonly area?: string }) {
  return (
    <CardGridTemplate header={<GoalsHeading area={area} />}>
      <GoalAreas {...(area === undefined ? {} : { only: area })} />
    </CardGridTemplate>
  )
}

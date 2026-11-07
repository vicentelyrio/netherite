import { GoalAreas, GoalsHeading } from '@/features/goals'
import { ColumnsTemplate } from '@/templates'

export function GoalsPage({ area }: { readonly area?: string }) {
  return (
    <ColumnsTemplate header={<GoalsHeading area={area} />}>
      <GoalAreas {...(area === undefined ? {} : { only: area })} />
    </ColumnsTemplate>
  )
}

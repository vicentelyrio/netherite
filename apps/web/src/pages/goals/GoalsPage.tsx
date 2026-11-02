import { Breadcrumbs } from '@/components'
import { GoalAreas } from '@/features/goals'
import { CardGridTemplate } from '@/templates'

/** Goals: every goal, one column per area. */
export function GoalsPage() {
  return (
    <CardGridTemplate
      header={
        <Breadcrumbs>
          <h1 className="breadcrumbs-title">Goals</h1>
        </Breadcrumbs>
      }
    >
      <GoalAreas />
    </CardGridTemplate>
  )
}

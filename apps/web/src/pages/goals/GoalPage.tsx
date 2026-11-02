import { GoalDetail, GoalGraph } from '@/features/goals'
import { BoardTemplate } from '@/templates'

/** One goal: its projects on the side, its graph beside them. */
export function GoalPage({ id }: { readonly id: string }) {
  return (
    <BoardTemplate
      side={<GoalDetail id={id} />}
      main={<GoalGraph id={id} />}
      mainRole="region"
      mainLabel="Graph"
      bleed
    />
  )
}

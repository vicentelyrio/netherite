import { GoalDetail, GoalGraph } from '@/features/goals'
import { BoardTemplate } from '@/templates'

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

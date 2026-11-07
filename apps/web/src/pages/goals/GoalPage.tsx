import { GoalDetail, GoalGraph } from '@/features/goals'
import { useI18nContext } from '@/infrastructure/i18n'
import { BoardTemplate } from '@/templates'

export function GoalPage({ id }: { readonly id: string }) {
  const { LL } = useI18nContext()
  return (
    <BoardTemplate
      side={<GoalDetail id={id} />}
      main={<GoalGraph id={id} />}
      mainRole="region"
      mainLabel={LL.goals.detail.graph()}
      bleed
    />
  )
}

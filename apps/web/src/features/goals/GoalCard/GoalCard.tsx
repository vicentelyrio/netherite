import type { GoalRow } from '@netherite/api'
import { Card } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { ProgressBar, TagList } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { horizonLabel } from '../horizon'
import './GoalCard.css'

/** A goal as a card: title, due date, tags and how much of it is done. */
export function GoalCard({ goal }: { readonly goal: GoalRow }) {
  const { LL } = useI18nContext()
  const achieved = goal.status === 'achieved'
  const progress = goal.progress ?? { done: 0, total: 0 }
  return (
    <Link to="/goals/$id" params={{ id: goal.id }} className="app-row-link">
      <Card interactive>
        <div className="goal-card">
          <div className="goal-card-top">
            <span className="goal-card-title">{goal.title}</span>
            {goal.horizon && <span className="goal-horizon">{horizonLabel(goal.horizon)}</span>}
            {achieved && <span className="goal-achieved">{LL.goals.achieved()}</span>}
          </div>
          {goal.due && <span className="app-muted">{LL.goals.due({ date: goal.due })}</span>}
          <TagList tags={goal.tags} />
          <ProgressBar
            done={achieved ? progress.total || 1 : progress.done}
            total={progress.total || (achieved ? 1 : 0)}
          />
        </div>
      </Card>
    </Link>
  )
}

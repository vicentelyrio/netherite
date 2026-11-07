import type { GoalRow } from '@netherite/api'
import { Card, Icon, StatusGlyph } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { ProgressBar, TagList, useReorderItem } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { noArea } from '../GoalAreas/areas'
import { horizonLabel } from '../horizon'
import { statusOfProgress } from '../status'
import './GoalCard.css'

export function GoalCardBody({ goal }: { readonly goal: GoalRow }) {
  const { LL } = useI18nContext()
  const achieved = goal.status === 'achieved'
  const progress = goal.progress ?? { done: 0, total: 0 }
  return (
    <div className="goal-card">
      {(goal.horizon || achieved) && (
        <div className="goal-card-top">
          {goal.horizon && (
            <span className="goal-horizon">
              <Icon
                name={goal.horizon === 'forever' ? 'all_inclusive' : 'hourglass_empty'}
                size="inline"
              />
              {horizonLabel(goal.horizon)}
            </span>
          )}
          {achieved && <span className="goal-achieved">{LL.goals.achieved()}</span>}
        </div>
      )}
      <span className="goal-card-title">
        <StatusGlyph
          type="goal"
          status={achieved ? 'done' : statusOfProgress(progress.done, progress.total)}
          progress={progress.total > 0 ? progress.done / progress.total : 0}
          size={16}
        />
        {goal.title}
      </span>
      {goal.due && <span className="app-muted">{LL.goals.due({ date: goal.due })}</span>}
      <TagList tags={goal.tags} />
      <ProgressBar
        done={achieved ? progress.total || 1 : progress.done}
        total={progress.total || (achieved ? 1 : 0)}
      />
    </div>
  )
}

export function GoalCard({ goal }: { readonly goal: GoalRow }) {
  const { attributes, listeners, setNodeRef, isDragging, edge } = useReorderItem(
    goal.id,
    goal.area ?? noArea,
    'group',
  )
  return (
    <div
      ref={setNodeRef}
      className="goal-draggable"
      data-dragging={isDragging || undefined}
      data-drop={edge}
      {...attributes}
      {...listeners}
    >
      <Link to="/goals/$id" params={{ id: goal.id }} className="app-row-link" draggable={false}>
        <Card interactive>
          <GoalCardBody goal={goal} />
        </Card>
      </Link>
    </div>
  )
}

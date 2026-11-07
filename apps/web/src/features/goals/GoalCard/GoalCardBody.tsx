import type { GoalRow } from '@netherite/api'
import { Icon, StatusGlyph } from '@netherite/ui'
import { ProgressBar, TagList } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { CardBody, CardTitle } from '../CardParts'
import { horizonLabel } from '../horizon'
import { statusOfProgress } from '../status'
import './GoalCard.css'

const glyphSize = 16

export function GoalCardBody({ goal }: { readonly goal: GoalRow }) {
  const { LL } = useI18nContext()
  const achieved = goal.status === 'achieved'
  const progress = goal.progress ?? { done: 0, total: 0 }
  return (
    <CardBody>
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
      <CardTitle>
        <StatusGlyph
          type="goal"
          status={achieved ? 'done' : statusOfProgress(progress.done, progress.total)}
          progress={progress.total > 0 ? progress.done / progress.total : 0}
          size={glyphSize}
        />
        {goal.title}
      </CardTitle>
      {goal.due && <span className="app-muted">{LL.goals.due({ date: goal.due })}</span>}
      <TagList tags={goal.tags} />
      <ProgressBar
        done={achieved ? progress.total || 1 : progress.done}
        total={progress.total || (achieved ? 1 : 0)}
      />
    </CardBody>
  )
}

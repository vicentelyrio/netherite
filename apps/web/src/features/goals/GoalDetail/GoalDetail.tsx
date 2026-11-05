import { NotFound } from '@netherite/api'
import { Banner, ProgressRing } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { now } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalQuery } from '@/infrastructure/query'
import { GoalProjects } from '../GoalProjects'
import { horizonElapsed, horizonLabel } from '../horizon'
import './GoalDetail.css'

export function GoalDetail({ id }: { readonly id: string }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(goalQuery(api, id))
  if (query.isPending) return <div className="app-muted">{LL.common.loading()}</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <Banner
        variant={missing ? 'warning' : 'danger'}
        title={missing ? LL.goals.detail.none({ id }) : LL.goals.detail.loadError()}
      >
        <Link to="/goals">{LL.goals.detail.back()}</Link>
      </Banner>
    )
  }
  const goal = query.data
  const progress = goal.progress ?? { done: 0, total: 0 }
  const horizon = horizonElapsed(goal, now().toDate())
  return (
    <div className="goal-detail-main">
      <Breadcrumbs>
        <Link to="/goals">{LL.goals.title()}</Link>
        {goal.area && (
          <>
            <span> / </span>
            <Link to="/goals" search={{ area: goal.area }}>
              {goal.area}
            </Link>
          </>
        )}
        <span> / </span>
        <strong>{goal.title}</strong>
      </Breadcrumbs>
      <header className="goal-head">
        <h1 className="app-title goal-title">{goal.title}</h1>
        <div className="goal-rings">
          {goal.horizon && (
            <div className="goal-ring">
              {horizon === undefined ? (
                <span className="goal-forever" role="img" aria-label={horizonLabel(goal.horizon)}>
                  ∞
                </span>
              ) : (
                <ProgressRing
                  done={horizon.elapsed}
                  total={horizon.total}
                  size={64}
                  label={LL.goals.detail.horizon()}
                />
              )}
              <span className="app-muted">
                {LL.goals.detail.horizon()} · {horizonLabel(goal.horizon)}
              </span>
            </div>
          )}
          <div className="goal-ring">
            <ProgressRing
              done={progress.done}
              total={progress.total}
              size={64}
              label={LL.goals.detail.progress()}
            />
            <span className="app-muted">{LL.goals.detail.progress()}</span>
          </div>
        </div>
      </header>
      <GoalProjects goalId={goal.id} projects={goal.projectRows} />
    </div>
  )
}

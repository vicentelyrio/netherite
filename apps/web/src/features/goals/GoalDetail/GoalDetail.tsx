import { NotFound } from '@netherite/api'
import { Banner, ProgressRing } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalQuery } from '@/infrastructure/query'
import { GoalProjects } from '../GoalProjects'
import './GoalDetail.css'

/** One goal: where it sits, how far along it is, and its projects. */
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
  return (
    <div className="goal-detail-main">
      <Breadcrumbs>
        <Link to="/goals">{LL.goals.title()}</Link>
        {goal.area && <span> / {goal.area}</span>}
        <span> / </span>
        <strong>{goal.title}</strong>
      </Breadcrumbs>
      <header className="goal-head">
        <h1 className="app-title goal-title">{goal.title}</h1>
        <div className="goal-ring">
          <ProgressRing
            done={progress.done}
            total={progress.total}
            size={64}
            label={LL.goals.detail.progress()}
          />
          <span className="app-muted">{LL.goals.detail.progress()}</span>
        </div>
      </header>
      <GoalProjects goalId={goal.id} projects={goal.projectRows} />
    </div>
  )
}

import { NotFound } from '@netherite/api'
import { Banner, Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Breadcrumbs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { boardQuery } from '@/infrastructure/query'
import { ProjectGraph } from '../ProjectGraph'
import { rememberProject } from '../ProjectsEntry/remember'
import { type ProjectViewId, projectViews } from '../views'
import './ProjectSide.css'

/** The project's name and where it sits, a switch between its views, and its small graph. */
export function ProjectSide({
  id,
  view,
  onViewChange,
}: {
  readonly id: string
  readonly view: ProjectViewId
  readonly onViewChange: (view: ProjectViewId) => void
}) {
  const api = useApi()
  const query = useQuery(boardQuery(api, id))
  useEffect(() => rememberProject(id), [id])
  if (query.isPending) return <div className="app-muted">Loading…</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <Banner
        variant={missing ? 'warning' : 'danger'}
        title={missing ? `No project ${id}` : 'Could not load this project'}
      >
        <Link to="/goals">Back to goals</Link>
      </Banner>
    )
  }
  const board = query.data
  const goal = board.goals[0]
  return (
    <>
      <Breadcrumbs>
        <Link to="/goals">Goals</Link>
        {goal && (
          <>
            <span> / </span>
            <Link to="/goals/$id" params={{ id: goal.id }}>
              {goal.title}
            </Link>
          </>
        )}
      </Breadcrumbs>
      <h1 className="app-title project-title">{board.title}</h1>
      <div className="project-views" role="tablist" aria-label="Views">
        {projectViews.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            aria-label={v.label}
            data-active={view === v.id || undefined}
            onClick={() => onViewChange(v.id)}
          >
            <Icon name={v.icon} />
          </button>
        ))}
        <span className="app-muted">{projectViews.find((v) => v.id === view)?.label}</span>
      </div>
      <ProjectGraph board={board} />
    </>
  )
}

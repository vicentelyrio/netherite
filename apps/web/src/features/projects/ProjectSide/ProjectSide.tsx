import { NotFound } from '@netherite/api'
import { Banner, Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Breadcrumbs, EditableText } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { boardQuery, useWrite } from '@/infrastructure/query'
import { ProjectActions } from '../ProjectActions'
import { ProjectGraph } from '../ProjectGraph'
import { rememberProject } from '../ProjectsEntry/remember'
import { type ProjectViewId, projectViews } from '../views'
import './ProjectSide.css'

export function ProjectSide({
  id,
  view,
  onViewChange,
}: {
  readonly id: string
  readonly view: ProjectViewId
  readonly onViewChange: (view: ProjectViewId) => void
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(boardQuery(api, id))
  const retitle = useWrite(api, (a, title: string) =>
    a.call((c) => c.items.update({ params: { id }, payload: { set: { title } } })),
  )
  useEffect(() => rememberProject(id), [id])
  if (query.isPending) return <div className="app-muted">{LL.common.loading()}</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <Banner
        variant={missing ? 'warning' : 'danger'}
        title={missing ? LL.projects.none({ id }) : LL.projects.loadError()}
      >
        <Link to="/goals">{LL.projects.back()}</Link>
      </Banner>
    )
  }
  const board = query.data
  const goal = board.goals[0]
  return (
    <>
      <Breadcrumbs>
        <Link to="/goals">{LL.projects.goals()}</Link>
        {goal && (
          <>
            <span> / </span>
            <Link to="/goals/$id" params={{ id: goal.id }}>
              {goal.title}
            </Link>
          </>
        )}
      </Breadcrumbs>
      <EditableText
        inputClassName="project-title-input"
        as="h1"
        className="app-title project-title"
        value={board.title}
        onSave={(title) => retitle.mutate(title)}
      />
      <div className="project-toolbar">
        <div className="project-views" role="tablist" aria-label={LL.projects.views.label()}>
          {projectViews.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              aria-label={LL.projects.views[v.id]()}
              data-active={view === v.id || undefined}
              onClick={() => onViewChange(v.id)}
            >
              <Icon name={v.icon} />
            </button>
          ))}
          <span className="app-muted">{LL.projects.views[view]()}</span>
        </div>
        <ProjectActions board={board} />
      </div>
      <ProjectGraph board={board} />
    </>
  )
}

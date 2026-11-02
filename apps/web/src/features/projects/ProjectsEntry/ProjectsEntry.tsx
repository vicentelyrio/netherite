import { EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from '@tanstack/react-router'
import { useApi } from '@/infrastructure/api'
import { projectsQuery } from '@/infrastructure/query'
import { lastProject } from './remember'

/**
 * Projects in the rail is not a list: a project is reached from its goal. It opens the board you
 * were on, or else the project with the most open tasks, or says there is none.
 */
export function ProjectsEntry() {
  const api = useApi()
  const query = useQuery(projectsQuery(api))
  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  const projects = query.data?.projects ?? []
  const remembered = lastProject()
  const open = (p: (typeof projects)[number]) => (p.progress?.total ?? 0) - (p.progress?.done ?? 0)
  const target =
    projects.find((p) => p.id === remembered) ??
    [...projects].sort((a, b) => open(b) - open(a) || a.id.localeCompare(b.id))[0]
  if (target === undefined) {
    return (
      <div className="app-page app-page--wide">
        <EmptyState
          icon="task_alt"
          title="No projects yet"
          description="Create one from a goal, and its tasks show up here as a board."
        />
      </div>
    )
  }
  return <Navigate to="/projects/$id" params={{ id: target.id }} replace />
}

import { Button, EmptyState, Grid } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate } from '@tanstack/react-router'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { projectsQuery } from '@/infrastructure/query'
import { lastProject } from './remember'

export function ProjectsEntry() {
  const { LL } = useI18nContext()
  const api = useApi()
  const navigate = useNavigate()
  const query = useQuery(projectsQuery(api))
  if (query.isPending) {
    return (
      <Grid.Col span={12}>
        <div className="app-muted">{LL.common.loading()}</div>
      </Grid.Col>
    )
  }
  const projects = query.data?.projects ?? []
  const remembered = lastProject()
  const open = (p: (typeof projects)[number]) => (p.progress?.total ?? 0) - (p.progress?.done ?? 0)
  const target =
    projects.find((p) => p.id === remembered) ??
    [...projects].sort((a, b) => open(b) - open(a) || a.id.localeCompare(b.id))[0]
  if (target === undefined) {
    return (
      <Grid.Col span={12}>
        <EmptyState
          icon="task_alt"
          title={LL.projects.entry.title()}
          description={LL.projects.entry.text()}
          actions={
            <Button
              icon="track_changes"
              variant="primary"
              onClick={() => void navigate({ to: '/goals' })}
            >
              {LL.projects.entry.action()}
            </Button>
          }
        />
      </Grid.Col>
    )
  }
  return <Navigate to="/projects/$id" params={{ id: target.id }} replace />
}

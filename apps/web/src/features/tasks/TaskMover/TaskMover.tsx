import { useQuery } from '@tanstack/react-query'
import { MovePicker } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { projectsQuery } from '@/infrastructure/query'

export function TaskMover({
  task,
  projectId,
  opened,
  onClose,
  onPick,
}: {
  readonly task: { readonly title: string }
  readonly projectId: string
  readonly opened: boolean
  readonly onClose: () => void
  readonly onPick: (project: string) => void
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const projects = useQuery({ ...projectsQuery(api), enabled: opened })
  const groups = new Map<string, NonNullable<typeof projects.data>['projects'][number][]>()
  for (const project of projects.data?.projects ?? []) {
    const label = project.goals[0]?.title ?? LL.projects.goals()
    groups.set(label, [...(groups.get(label) ?? []), project])
  }
  return (
    <MovePicker
      opened={opened}
      title={LL.tasks.actions.moveTitle({ name: task.title })}
      groups={[...groups].map(([label, rows]) => ({
        label,
        options: rows.map((p) => ({
          id: p.id,
          title: p.title,
          progress: p.progress ?? { done: 0, total: 0 },
          current: p.id === projectId,
        })),
      }))}
      onClose={onClose}
      onPick={onPick}
    />
  )
}

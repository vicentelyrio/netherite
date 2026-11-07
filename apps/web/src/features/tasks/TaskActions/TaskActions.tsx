import type { ItemDetail } from '@netherite/api'
import { ActionIcon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { DeleteAction, MovePicker } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { projectsQuery, useWrite } from '@/infrastructure/query'
import './TaskActions.css'

export function TaskActions({
  task,
  projectId,
}: {
  readonly task: ItemDetail
  readonly projectId: string
}) {
  const { LL } = useI18nContext()
  const text = LL.tasks.actions
  const api = useApi()
  const navigate = useNavigate()
  const notices = useNotices()
  const [moving, setMoving] = useState(false)
  const projects = useQuery({ ...projectsQuery(api), enabled: moving })
  const move = useWrite(api, (a, to: string) =>
    a.call((c) => c.items.update({ params: { id: task.id }, payload: { set: { project: to } } })),
  )
  const remove = useWrite(api, (a) =>
    a.call((c) => c.items.delete({ params: { id: task.id }, query: {} })),
  )
  const groups = new Map<string, NonNullable<typeof projects.data>['projects'][number][]>()
  for (const project of projects.data?.projects ?? []) {
    const label = project.goals[0]?.title ?? LL.projects.goals()
    groups.set(label, [...(groups.get(label) ?? []), project])
  }
  return (
    <div className="task-actions">
      <ActionIcon
        icon="drive_file_move"
        label={text.move()}
        variant="subtle"
        color="gray"
        loading={move.isPending}
        onClick={() => setMoving(true)}
      />
      <DeleteAction
        label={text.delete()}
        name={task.title}
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              notices.notify({ variant: 'success', title: text.deleted({ name: task.title }) })
              void navigate({ to: '/projects/$id', params: { id: projectId } })
            },
          })
        }
      />
      <MovePicker
        opened={moving}
        title={text.moveTitle({ name: task.title })}
        groups={[...groups].map(([label, rows]) => ({
          label,
          options: rows.map((p) => ({
            id: p.id,
            title: p.title,
            progress: p.progress ?? { done: 0, total: 0 },
            current: p.id === projectId,
          })),
        }))}
        onClose={() => setMoving(false)}
        onPick={(to) =>
          move.mutate(to, {
            onSuccess: () =>
              void navigate({ to: '/projects/$id', params: { id: to }, search: { task: task.id } }),
          })
        }
      />
    </div>
  )
}

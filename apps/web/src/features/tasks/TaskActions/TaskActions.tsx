import type { ItemDetail } from '@netherite/api'
import { ActionIcon } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { DeleteAction } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { TaskMover, useMoveTask } from '../TaskMover'
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
  const move = useMoveTask(task.id)
  const remove = useWrite(api, (a) =>
    a.call((c) => c.items.delete({ params: { id: task.id }, query: {} })),
  )
  return (
    <div className="task-actions">
      <ActionIcon
        icon="drive_file_move"
        label={text.move()}
        variant="subtle"
        color="gray"
        loading={move.pending}
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
      <TaskMover
        task={task}
        projectId={projectId}
        opened={moving}
        onClose={() => setMoving(false)}
        onPick={move.pick}
      />
    </div>
  )
}

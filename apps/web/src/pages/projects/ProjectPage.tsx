import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ProjectMain, ProjectSide, type ProjectViewId } from '@/features/projects'
import { TaskDrawer } from '@/features/tasks'
import { BoardTemplate } from '@/templates'

/** One project: its views on the board, the task open beside it in a drawer. */
export function ProjectPage({
  id,
  task,
  mode,
}: {
  readonly id: string
  readonly task?: string | undefined
  readonly mode?: 'split'
}) {
  const navigate = useNavigate()
  const [view, setView] = useState<ProjectViewId>('tasks')
  return (
    <BoardTemplate
      side={<ProjectSide id={id} view={view} onViewChange={setView} />}
      main={<ProjectMain id={id} view={view} task={task} />}
      overlay={
        <TaskDrawer
          id={task}
          projectId={id}
          {...(mode ? { initial: 'code' as const } : {})}
          onClose={() => void navigate({ to: '/projects/$id', params: { id }, search: {} })}
        />
      }
    />
  )
}

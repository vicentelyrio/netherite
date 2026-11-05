import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/infrastructure/api'
import { boardQuery } from '@/infrastructure/query'
import { KnowledgeView } from '../KnowledgeView'
import { TaskBoard } from '../TaskBoard'
import type { ProjectViewId } from '../views'

export function ProjectMain({
  id,
  view,
  task,
}: {
  readonly id: string
  readonly view: ProjectViewId
  readonly task: string | undefined
}) {
  const api = useApi()
  const query = useQuery(boardQuery(api, id))
  if (!query.data) return null
  const board = query.data
  if (view === 'tasks') return <TaskBoard board={board} selected={task} />
  return <KnowledgeView board={board} />
}

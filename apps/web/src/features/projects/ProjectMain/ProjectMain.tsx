import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/infrastructure/api'
import { boardQuery } from '@/infrastructure/query'
import { KnowledgeView } from '../KnowledgeView'
import { TaskBoard } from '../TaskBoard'
import type { ProjectViewId } from '../views'

/** The chosen view of a project: its task board, or what it knows: decisions, docs and context. */
export function ProjectMain({
  id,
  view,
  task,
}: {
  readonly id: string
  readonly view: ProjectViewId
  /** The task open in the drawer, marked on the board. */
  readonly task: string | undefined
}) {
  const api = useApi()
  const query = useQuery(boardQuery(api, id))
  if (!query.data) return null
  const board = query.data
  if (view === 'tasks') return <TaskBoard board={board} selected={task} />
  return <KnowledgeView board={board} />
}

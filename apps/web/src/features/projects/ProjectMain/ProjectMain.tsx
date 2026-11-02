import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/infrastructure/api'
import { boardQuery } from '@/infrastructure/query'
import { LinkedItems } from '../LinkedItems'
import { TaskBoard } from '../TaskBoard'
import type { ProjectViewId } from '../views'

/** The chosen view of a project: its task board, its docs, or its decisions and context. */
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
  if (view === 'docs') {
    return (
      <LinkedItems
        board={board}
        types={['doc', 'runbook']}
        empty="No docs or runbooks link to this project."
      />
    )
  }
  return (
    <LinkedItems
      board={board}
      types={['adr', 'context']}
      empty="No decisions or context link to this project."
    />
  )
}

import { useQuery } from '@tanstack/react-query'
import { GraphView } from '@/graph/GraphView'
import { useApi } from '@/infrastructure/api'
import { goalQuery, graphQuery } from '@/infrastructure/query'
import './GoalGraph.css'

/** The goal and what hangs from it, in the graph. */
export function GoalGraph({ id }: { readonly id: string }) {
  const api = useApi()
  const graph = useQuery(graphQuery(api))
  const goal = useQuery(goalQuery(api, id))
  if (!graph.data) return <div className="gv app-muted">Loading graph…</div>
  return (
    <div className="goal-graph">
      <GraphView
        data={graph.data}
        variant="embedded"
        focus={id}
        labels="neighbors"
        nodeScale={1.25}
        pad={96}
        label={`${goal.data?.title ?? id}: projects and tasks`}
      />
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { GraphView } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { goalQuery, graphQuery } from '@/infrastructure/query'
import './GoalGraph.css'

export function GoalGraph({ id }: { readonly id: string }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const graph = useQuery(graphQuery(api))
  const goal = useQuery(goalQuery(api, id))
  if (!graph.data) return <div className="gv app-muted">{LL.goals.detail.graphLoading()}</div>
  return (
    <div className="goal-graph">
      <GraphView
        className="goal-graph-view"
        data={graph.data}
        variant="embedded"
        focus={id}
        labels="neighbors"
        nodeScale={1.25}
        pad={96}
        label={LL.goals.detail.graphLabel({ title: goal.data?.title ?? id })}
      />
    </div>
  )
}

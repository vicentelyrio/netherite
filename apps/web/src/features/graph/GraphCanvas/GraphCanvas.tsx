import { Banner, EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { GraphView } from '@/components'
import { useApi } from '@/infrastructure/api'
import { graphQuery } from '@/infrastructure/query'

/** Every item and the links between them, full size; or why there is nothing to show. */
export function GraphCanvas({ focus }: { readonly focus?: string | undefined }) {
  const api = useApi()
  const query = useQuery(graphQuery(api))
  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title="Could not load the graph">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  if (query.data.nodes.length === 0) {
    return (
      <div className="app-page">
        <EmptyState
          icon="hub"
          title="Nothing to draw"
          description="Add goals, projects and tasks and they show up here."
        />
      </div>
    )
  }
  return (
    <GraphView
      data={query.data}
      focus={focus}
      labels="neighbors"
      nodeScale={1.5}
      pad={150}
      padBottom={70}
      label="All items and the links between them"
    />
  )
}

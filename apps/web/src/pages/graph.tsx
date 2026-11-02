import { Banner, EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { graphQuery, itemQuery } from '@/infrastructure/query'
import { GraphView } from '../graph/GraphView'

export function GraphPage({ focus }: { readonly focus?: string | undefined }) {
  const api = useApi()
  const query = useQuery(graphQuery(api))
  const focused = useQuery({ ...itemQuery(api, focus ?? ''), enabled: focus !== undefined })
  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page app-page--wide">
        <Banner variant="danger" title="Could not load the graph">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  if (query.data.nodes.length === 0) {
    return (
      <div className="app-page app-page--wide">
        <EmptyState
          icon="hub"
          title="Nothing to draw"
          description="Add goals, projects and tasks and they show up here."
        />
      </div>
    )
  }
  return (
    <div className="graph-page">
      <header className="graph-head">
        <Breadcrumbs icon="hub">
          {focus ? (
            <>
              <Link to="/graph">Graph</Link>
              <span> / </span>
              <strong>{focused.data?.type ?? focus}</strong>
            </>
          ) : (
            <h1 className="breadcrumbs-title">Graph</h1>
          )}
        </Breadcrumbs>
        {focus && <h1 className="app-title graph-title">{focused.data?.title ?? focus}</h1>}
      </header>
      <GraphView
        data={query.data}
        focus={focus}
        labels="neighbors"
        nodeScale={1.5}
        pad={150}
        padBottom={70}
        label="All items and the links between them"
      />
    </div>
  )
}

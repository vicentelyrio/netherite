import { Banner, EmptyState, Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { GraphView } from '../graph/GraphView'
import { useApi } from '../lib/app-context'
import { graphQuery, itemQuery } from '../lib/queries'

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
        <nav className="goal-crumbs" aria-label="Breadcrumb">
          <Icon name="hub" />
          {focus ? (
            <>
              <Link to="/graph">Graph</Link>
              <span> / </span>
              <strong>{focused.data?.type ?? focus}</strong>
            </>
          ) : (
            <h1 className="goal-crumb-title">Graph</h1>
          )}
        </nav>
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

import type { Board } from '@netherite/api'
import { Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { GraphView } from '@/graph/GraphView'
import { useApi } from '@/infrastructure/api'
import { graphQuery } from '@/infrastructure/query'
import './ProjectGraph.css'

/** The project and what is next to it, small, with a way to open the full graph. */
export function ProjectGraph({ board }: { readonly board: Board }) {
  const api = useApi()
  const query = useQuery(graphQuery(api))
  return (
    <section className="project-graph" aria-label="Graph">
      <Link
        to="/graph"
        search={{ focus: board.id }}
        aria-label="Open the graph"
        className="project-graph-open"
      >
        <Icon name="open_in_full" />
      </Link>
      {query.data ? (
        <GraphView
          data={query.data}
          variant="embedded"
          legend="row"
          labels="focus"
          nodeScale={0.85}
          pad={20}
          padBottom={56}
          zoomButtons={false}
          focus={board.id}
          label={`${board.title}: tasks`}
        />
      ) : (
        <p className="app-muted">Loading graph…</p>
      )}
    </section>
  )
}

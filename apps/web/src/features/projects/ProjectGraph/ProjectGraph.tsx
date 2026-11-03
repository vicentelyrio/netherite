import type { Board } from '@netherite/api'
import { Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { GraphView } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { graphQuery } from '@/infrastructure/query'
import './ProjectGraph.css'

/** The project and what is next to it, small, with a way to open the full graph. */
export function ProjectGraph({ board }: { readonly board: Board }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(graphQuery(api))
  return (
    <section className="project-graph" aria-label={LL.projects.graph()}>
      <Link
        to="/graph"
        search={{ focus: board.id }}
        aria-label={LL.projects.openGraph()}
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
          padBottom={96}
          zoomButtons={false}
          focus={board.id}
          label={LL.projects.graphLabel({ title: board.title })}
        />
      ) : (
        <p className="app-muted">{LL.projects.graphLoading()}</p>
      )}
    </section>
  )
}

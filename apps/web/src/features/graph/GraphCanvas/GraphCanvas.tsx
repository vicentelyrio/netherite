import { Banner, EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { GraphView } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { graphQuery } from '@/infrastructure/query'

/** Every item and the links between them, full size; or why there is nothing to show. */
export function GraphCanvas({ focus }: { readonly focus?: string | undefined }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(graphQuery(api))
  if (query.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title={LL.graph.loadError()}>
          {LL.common.serveHint()}
        </Banner>
      </div>
    )
  }
  if (query.data.nodes.length === 0) {
    return (
      <div className="app-page">
        <EmptyState icon="hub" title={LL.graph.empty.title()} description={LL.graph.empty.text()} />
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
      label={LL.graph.label()}
    />
  )
}

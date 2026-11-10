import { Banner, EmptyState } from '@netherite/ui'
import { useEffect, useMemo, useRef } from 'react'
import { GraphView } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useGraphAt, useGraphTime } from '../GraphTime'
import './GraphCanvas.css'

export function GraphCanvas({ focus }: { readonly focus?: string | undefined }) {
  const { LL } = useI18nContext()
  const query = useGraphAt()
  const { asOf } = useGraphTime()

  const seen = useRef<ReadonlySet<string> | undefined>(undefined)
  const glow = useMemo(() => {
    const before = seen.current
    if (before === undefined || query.data === undefined || asOf === undefined) return undefined
    return new Set(query.data.nodes.filter((n) => !before.has(n.id)).map((n) => n.id))
  }, [query.data, asOf])
  useEffect(() => {
    if (query.data !== undefined) seen.current = new Set(query.data.nodes.map((n) => n.id))
  }, [query.data])

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
  if (query.data.nodes.length === 0 && asOf === undefined) {
    return (
      <div className="graph-empty">
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
      shortcuts
      glow={glow}
    />
  )
}

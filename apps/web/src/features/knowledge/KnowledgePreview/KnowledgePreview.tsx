import type { KnowledgeRow } from '@netherite/api'
import { Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LinkRow } from '@/components'
import { useApi } from '@/infrastructure/api'
import { previewQuery } from '@/infrastructure/query'
import { useKnowledgeIndex } from '../KnowledgeProvider'
import '../shared.css'
import { useI18nContext } from '@/infrastructure/i18n'
import './KnowledgePreview.css'

function Preview({ row }: { readonly row: KnowledgeRow }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(previewQuery(api, row.id))
  const data = query.data
  return (
    <aside className="kn-preview" aria-label={LL.knowledge.preview.label({ id: row.id })}>
      <div className="kn-preview-top">
        <TypeBadge type={row.type as ItemTypeName} />
        <Link
          to="/items/$id"
          params={{ id: row.id }}
          className="kn-open"
          aria-label={LL.knowledge.preview.open()}
        >
          {LL.knowledge.preview.open()} <Icon name="arrow_forward" size={16} />
        </Link>
      </div>
      <div>
        <h2 className="kn-preview-title">
          {row.id} · {row.title}
        </h2>
        <div className="kn-mono">{row.path}</div>
      </div>
      {row.freshness === 'stale' && (
        <div className="kn-warning">
          <Icon name="warning" size={18} filled />
          <div>
            <strong>{LL.knowledge.preview.staleTitle({ count: row.commits })}</strong>
            <span>
              {LL.knowledge.preview.lastReviewed({
                date: row.date ?? LL.knowledge.preview.never(),
              })}
            </span>
          </div>
        </div>
      )}
      {query.isPending && <p className="app-muted">{LL.common.loading()}</p>}
      {query.isError && <p className="app-muted">{LL.knowledge.preview.loadError()}</p>}
      {data && (
        <>
          <p className="kn-summary">{data.summary || LL.knowledge.preview.noSummary()}</p>
          <section>
            <h3 className="kn-h">
              {LL.knowledge.preview.backlinks({ count: data.backlinks.length })}
            </h3>
            {data.backlinks.map((b) => (
              <LinkRow key={`${b.kind}:${b.path}`} link={b} />
            ))}
            {data.backlinks.length === 0 && (
              <div className="kn-none">
                <Icon name="link_off" size={15} /> {LL.knowledge.preview.noBacklinks()}
              </div>
            )}
          </section>
          <section>
            <h3 className="kn-h">{LL.knowledge.preview.coChanged()}</h3>
            {data.coChanged === null ? (
              <p className="app-muted">{LL.knowledge.preview.needsGit()}</p>
            ) : (
              data.coChanged.files.map((f) => (
                <div key={f.path} className="kn-file-row">
                  <span className="kn-mono">{f.path}</span>
                  <span className="kn-bar-mini">
                    <span style={{ width: `${Math.round(f.share * 100)}%` }} />
                  </span>
                  <span className="app-muted">{f.commits}</span>
                </div>
              ))
            )}
            {data.coChanged?.files.length === 0 && (
              <p className="app-muted">{LL.knowledge.preview.noCoChanged()}</p>
            )}
          </section>
        </>
      )}
      <footer className="kn-preview-foot">
        {LL.knowledge.preview.updated({ date: row.date ?? '—' })}
      </footer>
    </aside>
  )
}

/** The file picked in the table, with its summary, backlinks and the files that change with it. */
export function KnowledgePreview() {
  const { current } = useKnowledgeIndex()
  return current ? <Preview row={current} /> : null
}

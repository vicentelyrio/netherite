import type { KnowledgeRow } from '@netherite/api'
import { Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LinkRow } from '@/components'
import { useApi } from '@/infrastructure/api'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { previewQuery } from '@/infrastructure/query'
import { CoChangedFile } from '../CoChangedFile'
import { NoLinks } from '../NoLinks'

export function KnowledgePreviewContent({ row }: { readonly row: KnowledgeRow }) {
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
        {data?.source !== undefined && (
          <div className="kn-source">
            {LL.knowledge.preview.importedFrom({ source: data.source })}
            {data.importedAt !== undefined && ` · ${data.importedAt}`}
          </div>
        )}
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
            {data.backlinks.length === 0 && <NoLinks>{LL.knowledge.preview.noBacklinks()}</NoLinks>}
          </section>
          <section>
            <h3 className="kn-h">{LL.knowledge.preview.coChanged()}</h3>
            {data.coChanged === null ? (
              <p className="app-muted">{LL.knowledge.preview.needsGit()}</p>
            ) : (
              data.coChanged.files.map((f) => <CoChangedFile key={f.path} file={f} />)
            )}
            {data.coChanged?.files.length === 0 && (
              <p className="app-muted">{LL.knowledge.preview.noCoChanged()}</p>
            )}
          </section>
        </>
      )}
      <footer className="kn-preview-foot">
        {data?.lastCommit ? (
          <>
            <code>{data.lastCommit.hash.slice(0, 7)}</code> {data.lastCommit.subject}
            {' · '}
            {ago(data.lastCommit.date)}
          </>
        ) : (
          LL.knowledge.preview.updated({ date: row.date ?? '—' })
        )}
      </footer>
    </aside>
  )
}

import type { ItemDetail } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Banner,
  Button,
  Icon,
  type ItemTypeName,
  OrphanTag,
  Switch,
  TypeBadge,
} from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { SourceEditor } from '@/features/editor'
import { useApi } from '@/infrastructure/api'
import { formatDate, isoDay } from '@/infrastructure/datetime'
import {
  itemHistoryQuery,
  keys,
  previewQuery,
  useHealth,
  useWrite,
  viewQuery,
} from '@/infrastructure/query'

export const knowledgeTypes = new Set(['adr', 'doc', 'context', 'runbook'])

/** The steps an ADR goes through: where it has been and where it is. */
export function Lifecycle({
  status,
  steps,
}: {
  readonly status: string
  readonly steps: ReadonlyArray<{ status: string; date?: string; sha?: string }>
}) {
  const order =
    status === 'deprecated'
      ? ['proposed', 'accepted', 'deprecated']
      : status === 'superseded'
        ? ['proposed', 'accepted', 'superseded']
        : ['proposed', 'accepted']
  const at = order.indexOf(status)
  return (
    <ol className="kn-lifecycle" aria-label="Lifecycle">
      {order.map((step, i) => {
        const record = steps.filter((s) => s.status === step).at(-1)
        return (
          <li
            key={step}
            data-state={i < at ? 'past' : i === at ? 'current' : 'next'}
            data-status={step}
            aria-current={i === at ? 'step' : undefined}
          >
            <span className="kn-step-node">
              <Icon name={step === 'superseded' ? 'swap_horiz' : 'check'} size={13} />
            </span>
            <strong>{step}</strong>
            <span className="app-muted">
              {record?.date
                ? `${formatDate(record.date)}${record.sha ? ` · ${record.sha}` : ''}`
                : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function SupersessionChain({
  id,
  chain,
}: {
  readonly id: string
  readonly chain: ReadonlyArray<{ id: string; title: string; status?: string | undefined }>
}) {
  if (chain.length < 2) return null
  // Newest first, as the design lists them: each one supersedes the next.
  const newest = [...chain].reverse()
  return (
    <section aria-label="Supersession chain" className="kf-section">
      <h2 className="kf-h">Supersession chain</h2>
      <div className="kf-chain">
        {newest.map((link, i) => (
          <div key={link.id}>
            {i > 0 && (
              <div className="kf-chain-gap">
                <span />
                supersedes
              </div>
            )}
            <div
              className="kf-chain-row"
              data-current={link.id === id || undefined}
              data-old={link.status === 'superseded' || undefined}
            >
              <span
                className="kf-diamond"
                data-hollow={link.status === 'superseded' || undefined}
              />
              <Link to="/items/$id" params={{ id: link.id }} className="kf-chain-id">
                {link.id}
              </Link>
              <span className="kf-chain-title">{link.title}</span>
              {link.id === id ? <span className="app-muted">this</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Warning({
  title,
  detail,
  actions,
}: {
  readonly title: string
  readonly detail: string
  readonly actions?: React.ReactNode
}) {
  return (
    <div className="kf-warning">
      <Icon name="warning" size={20} filled />
      <div className="kf-warning-text">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {actions}
    </div>
  )
}

function ContextCard({
  item,
  context,
}: {
  readonly item: ItemDetail
  readonly context: NonNullable<
    ReturnType<typeof viewQuery> extends never
      ? never
      : {
          include: boolean
          targets: ReadonlyArray<{
            target: string
            path: string
            included: boolean
            omitted: boolean
            tokens: number
            budget: number
            stale: boolean
          }>
        }
  >
}) {
  const api = useApi()
  const toggle = useWrite(api, (a, include: boolean) =>
    a.call((c) =>
      c.items.update({
        params: { id: item.id },
        payload: { set: { include_in_context: include }, baseHash: item.hash },
      }),
    ),
  )
  const first = context.targets[0]
  const pct =
    first && first.budget > 0 ? Math.min(100, Math.round((first.tokens / first.budget) * 100)) : 0
  return (
    <section aria-label="Context" className="kf-context" data-on={context.include || undefined}>
      <div className="kf-context-top">
        <Icon name="smart_toy" size={20} />
        <div>
          <strong>Include in AI context</strong>
          <span>
            {context.include
              ? 'Sent to agents working in this repo'
              : 'Excluded: agents won’t receive this doc'}
          </span>
        </div>
        <Switch
          checked={context.include}
          disabled={toggle.isPending}
          onChange={(e) => toggle.mutate(e.currentTarget.checked)}
          label={<span className="nt-visually-hidden">Include in context</span>}
        />
      </div>
      {first && (
        <div className="kf-context-tokens" data-off={!context.include || undefined}>
          <span className="kf-context-number">≈ {first.tokens.toLocaleString('en-US')}</span>
          <span>tokens</span>
          <span className="kf-context-bar">
            <span style={{ width: `${pct}%` }} />
          </span>
          <span>of {first.budget.toLocaleString('en-US')} repo budget</span>
        </div>
      )}
      <div className="kf-context-targets" data-off={!context.include || undefined}>
        <span>Synced to</span>
        {context.targets.map((t) => (
          <code key={t.target}>{t.path}</code>
        ))}
        {context.targets.length === 0 && (
          <span className="app-muted">No sync targets are configured.</span>
        )}
      </div>
    </section>
  )
}

/**
 * A doc, ADR, context or runbook, as designed (DocView.dc.html): a header with where the file is,
 * the file beside its rendered text with what is special about its type above, a panel of what it
 * is connected to, and a status bar.
 */
export function KnowledgeFrame({
  item,
  mode: start,
}: {
  readonly item: ItemDetail
  /** `split` opens with the file beside the text. */
  readonly mode?: 'split'
}) {
  const api = useApi()
  const client = useQueryClient()
  const navigate = useNavigate()
  const health = useHealth(api)
  const view = useQuery(viewQuery(api, item.id))
  const preview = useQuery(previewQuery(api, item.id))
  const history = useQuery({ ...itemHistoryQuery(api, item.id), enabled: item.type === 'adr' })
  const [mode, setMode] = useState<'split' | 'text'>(start ?? 'text')
  const [changedLines, setChangedLines] = useState(0)
  const [showChanges, setShowChanges] = useState(false)

  const reload = () => void client.invalidateQueries({ queryKey: keys.item(item.id) })
  const review = useWrite(
    api,
    (a, hash: string) =>
      a.call((c) => c.items.markReviewed({ params: { id: item.id }, payload: { baseHash: hash } })),
    { reload },
  )

  const type = item.type as ItemTypeName
  const folder = item.path.split('/').slice(-2, -1)[0] ?? ''
  const file = item.path.split('/').at(-1) ?? item.id
  const fresh = item.freshness
  const stale = fresh !== null && (fresh.state === 'stale' || fresh.state === 'drifting')
  const newer = item.backlinks.find((l) => l.kind === 'supersedes' && l.id !== undefined)
  const data = view.data
  const steps =
    history.data?.transitions
      .filter((t) => t.field === 'status' && t.kind !== 'seen')
      .map((t) => ({
        status: typeof t.to === 'string' ? t.to : '',
        date: t.date,
        sha: t.hash.slice(0, 7),
      })) ?? []

  const middle = (
    <div className="kf-main">
      {stale && type !== 'adr' && (
        <Warning
          title={`Related code changed in ${fresh.commits} ${fresh.commits === 1 ? 'commit' : 'commits'} since this doc was updated`}
          detail={`Reviewed ${fresh.since ?? 'never'}`}
          actions={
            <div className="kf-warning-actions">
              <button
                type="button"
                className="kf-amber"
                onClick={() => setShowChanges(!showChanges)}
              >
                {showChanges ? 'Hide changes' : 'Review changes'}
              </button>
              <button
                type="button"
                className="kf-amber-ghost"
                disabled={review.isPending}
                onClick={() => review.mutate(item.hash)}
              >
                Mark reviewed
              </button>
            </div>
          }
        />
      )}
      {showChanges && data?.changes && (
        <ul className="kn-commits" aria-label="Commits since review">
          {data.changes.commits.map((c) => (
            <li key={c.hash}>
              <code>{c.hash.slice(0, 7)}</code> {c.subject}{' '}
              <span className="app-muted">
                {c.author}, {isoDay(c.date)}
              </span>
            </li>
          ))}
          {data.changes.commits.length === 0 && (
            <li className="app-muted">Only uncommitted changes.</li>
          )}
        </ul>
      )}
      {type === 'adr' && item.status === 'superseded' && (
        <div className="kf-superseded">
          <Icon name="swap_horiz" size={20} />
          <div>
            <strong>
              Superseded by {newer?.id ?? 'a newer decision'}
              {newer?.title ? ` · ${newer.title}` : ''}
            </strong>
            <span>This record is kept for history and no longer applies.</span>
          </div>
          {newer?.id && (
            <Link to="/items/$id" params={{ id: newer.id }} className="kf-open">
              Open {newer.id} <Icon name="arrow_forward" size={16} />
            </Link>
          )}
        </div>
      )}
      {type === 'adr' && item.status !== undefined && (
        <Lifecycle status={item.status} steps={steps} />
      )}
      {type === 'context' && data?.context && <ContextCard item={item} context={data.context} />}
      {!/^\s*#\s/.test(item.body) && <h1 className="kf-title">{item.title}</h1>}
      <Markdown source={item.body} />
    </div>
  )

  const panel = (
    <aside className="kf-panel" aria-label="Related">
      <section className="kf-section">
        <h2 className="kf-h">Type &amp; status</h2>
        <div className="kf-status-row">
          <TypeBadge type={type} />
          {type === 'adr' && item.status !== undefined && (
            <AdrStatusPill status={item.status as AdrStatus} />
          )}
          {item.orphan && <OrphanTag />}
        </div>
      </section>
      {type === 'adr' && data && <SupersessionChain id={item.id} chain={data.chain} />}
      {stale && type !== 'adr' && data?.changes && (
        <section className="kf-section">
          <h2 className="kf-h">Freshness</h2>
          <span className="kf-stale-line">
            <Icon name="warning" size={15} filled /> {fresh.commits} commits since review
          </span>
          {data.changes.commits.slice(0, 3).map((c) => (
            <div key={c.hash} className="kf-commit">
              <code>{c.hash.slice(0, 7)}</code>
              <span>{c.subject}</span>
              <span className="app-muted">{isoDay(c.date)}</span>
            </div>
          ))}
        </section>
      )}
      <section className="kf-section">
        <h2 className="kf-h">Linked from · {item.backlinks.length}</h2>
        {item.backlinks.map((l) => (
          <LinkRow key={`${l.kind}:${l.path}`} link={l} />
        ))}
        {item.backlinks.length === 0 && (
          <div className="kn-none">
            <Icon name="link_off" size={15} /> Orphan: nothing links here
          </div>
        )}
      </section>
      <section className="kf-section">
        <h2 className="kf-h">Links to · {item.links.length}</h2>
        {item.links.map((l) => (
          <LinkRow key={`${l.kind}:${l.path}`} link={l} />
        ))}
        {item.links.length === 0 && <p className="app-muted">No outgoing links</p>}
      </section>
      <section className="kf-section">
        <h2 className="kf-h">
          <Icon name="commit" size={15} /> Changes with
        </h2>
        {preview.data?.coChanged === null ? (
          <p className="app-muted">Needs git history.</p>
        ) : (
          preview.data?.coChanged?.files.map((f) => (
            <div key={f.path} className="kn-file-row">
              <span className="kn-mono">{f.path}</span>
              <span className="kn-bar-mini">
                <span style={{ width: `${Math.round(f.share * 100)}%` }} />
              </span>
              <span className="app-muted">{f.commits}</span>
            </div>
          ))
        )}
        {preview.data?.coChanged?.files.length === 0 && (
          <p className="app-muted">No files change with it yet</p>
        )}
      </section>
    </aside>
  )

  return (
    <div className="kf-frame" data-hash={item.hash}>
      <div className="kf-backdrop" />
      <article className="kf-sheet" aria-label={item.title} data-hash={item.hash}>
        <header className="kf-head">
          <Icon name="stacks" size={16} />
          <nav className="drawer-crumbs" aria-label="File path">
            <span>Knowledge</span> › <span>{folder}</span> › <strong>{file}</strong>
          </nav>
          <TypeBadge type={type} />
          {changedLines > 0 && (
            <span className="drawer-lines">
              M {changedLines} {changedLines === 1 ? 'line' : 'lines'} changed
            </span>
          )}
          <code className="app-id kf-id">{item.id}</code>
          <span className="kn-spacer" />
          {!stale && (type === 'doc' || type === 'runbook' || type === 'context') && (
            <Button
              size="sm"
              icon="done_all"
              loading={review.isPending}
              onClick={() => review.mutate(item.hash)}
            >
              Mark reviewed
            </Button>
          )}
          <button
            type="button"
            className="kf-close"
            aria-label="Close"
            title="Close (Esc)"
            onClick={() => void navigate({ to: '/knowledge' })}
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="kf-body">
          <SourceEditor
            id={item.id}
            variant="drawer"
            preview={
              <div className="kf-split">
                {middle}
                {panel}
              </div>
            }
            mode={mode}
            onModeChange={(m) => setMode(m as 'split' | 'text')}
            onStats={(stats) => setChangedLines(stats.changedLines)}
            branch={health.data?.branch}
          />
        </div>
      </article>
    </div>
  )
}

function LinkRow({ link }: { readonly link: ItemDetail['links'][number] }) {
  return (
    <div className="kn-link-row">
      <span className="kn-link-dot" />
      {link.id ? (
        <Link to="/items/$id" params={{ id: link.id }}>
          {link.id} {link.title}
        </Link>
      ) : (
        <code>{link.path}</code>
      )}
      <span className="app-muted">{link.kind.replace('_', ' ')}</span>
    </div>
  )
}

export { Banner, Button }

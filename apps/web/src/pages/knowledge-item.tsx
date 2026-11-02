import type { ItemDetail } from '@netherite/api'
import { Banner, Button, Icon, Progress, Switch } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useApi } from '../lib/app-context'
import { previewQuery, viewQuery } from '../lib/queries'
import { useWrite } from '../lib/writes'

export const knowledgeTypes = new Set(['adr', 'doc', 'context', 'runbook'])

const lifecycle = ['proposed', 'accepted', 'deprecated', 'superseded'] as const

/** The steps an ADR goes through; `deprecated` and `superseded` are the two ways it ends. */
export function Lifecycle({ status }: { readonly status: string }) {
  const steps =
    status === 'deprecated'
      ? lifecycle.filter((s) => s !== 'superseded')
      : status === 'superseded'
        ? lifecycle.filter((s) => s !== 'deprecated')
        : ['proposed', 'accepted']
  const at = steps.indexOf(status as never)
  return (
    <ol className="kn-lifecycle" aria-label="Lifecycle">
      {steps.map((step, i) => (
        <li
          key={step}
          data-state={i < at ? 'past' : i === at ? 'current' : 'next'}
          aria-current={i === at ? 'step' : undefined}
        >
          {step}
        </li>
      ))}
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
  return (
    <section aria-label="Supersession chain" className="kn-chain">
      <h2 className="nt-overline">Supersession chain</h2>
      <ol>
        {chain.map((link) => (
          <li key={link.id}>
            {link.id === id ? (
              <strong>
                {link.id} {link.title}
              </strong>
            ) : (
              <Link to="/items/$id" params={{ id: link.id }}>
                {link.id} {link.title}
              </Link>
            )}{' '}
            <span className="app-muted">{link.status}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ContextPanel({
  item,
  context,
}: {
  readonly item: ItemDetail
  readonly context: NonNullable<ReturnType<typeof useViewData>['context']>
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
  return (
    <section aria-label="Context" className="kn-context">
      <Switch
        checked={context.include}
        disabled={toggle.isPending}
        onChange={(e) => toggle.mutate(e.currentTarget.checked)}
        label="Include in context"
      />
      <h2 className="nt-overline">Sync targets</h2>
      <ul className="kn-targets">
        {context.targets.map((t) => (
          <li key={t.target}>
            <div className="app-row">
              <code>{t.path}</code>
              <span className="app-muted">
                {t.omitted ? 'over budget, left out' : t.included ? 'in the block' : 'not included'}
              </span>
              {t.stale && <span className="app-muted">file out of date: run context sync</span>}
            </div>
            {(t.included || t.omitted) && (
              <Progress done={t.tokens} total={t.budget} label={`${t.path} token budget`} />
            )}
            <span className="app-muted">
              ≈{t.tokens.toLocaleString('en-US')} of {t.budget.toLocaleString('en-US')} tokens
            </span>
          </li>
        ))}
        {context.targets.length === 0 && (
          <li className="app-muted">No sync targets are configured.</li>
        )}
      </ul>
    </section>
  )
}

const useViewData = (id: string) => {
  const api = useApi()
  const query = useQuery(viewQuery(api, id))
  return (
    query.data ?? {
      id,
      chain: [],
      changes: null,
      context: null,
    }
  )
}

/** What sits above a knowledge item's text: the stale or supersession banner, lifecycle and chain, or the context controls. */
export function KnowledgeTop({
  item,
  onReview,
  reviewing,
}: {
  readonly item: ItemDetail
  readonly onReview: () => void
  readonly reviewing: boolean
}) {
  const view = useViewData(item.id)
  const [showing, setShowing] = useState(false)
  const fresh = item.freshness
  const stale = fresh !== null && (fresh.state === 'stale' || fresh.state === 'drifting')
  const newer = item.backlinks.find((l) => l.kind === 'supersedes' && l.id !== undefined)

  return (
    <>
      {stale && (item.type === 'doc' || item.type === 'runbook' || item.type === 'context') && (
        <Banner
          variant="warning"
          title="This may be out of date"
          actions={
            <>
              <Button size="sm" onClick={() => setShowing(!showing)}>
                {showing ? 'Hide changes' : 'Review changes'}
              </Button>
              <Button size="sm" loading={reviewing} onClick={onReview}>
                Mark reviewed
              </Button>
            </>
          }
        >
          {fresh.commits} {fresh.commits === 1 ? 'commit' : 'commits'}
          {fresh.atLeast ? ' or more' : ''} touched what it covers
          {fresh.since ? ` since ${fresh.since}` : ''}.
        </Banner>
      )}
      {showing && view.changes && (
        <ul className="kn-commits" aria-label="Commits since review">
          {view.changes.commits.map((c) => (
            <li key={c.hash}>
              <code>{c.hash.slice(0, 7)}</code> {c.subject}{' '}
              <span className="app-muted">
                {c.author}, {c.date.slice(0, 10)}
              </span>
            </li>
          ))}
          {view.changes.commits.length === 0 && (
            <li className="app-muted">Only uncommitted changes.</li>
          )}
        </ul>
      )}
      {item.type === 'adr' && item.status === 'superseded' && (
        <Banner variant="info" title="Superseded">
          {newer ? (
            <>
              Replaced by{' '}
              <Link to="/items/$id" params={{ id: newer.id as string }}>
                {newer.id} {newer.title}
              </Link>
              .
            </>
          ) : (
            'A newer decision replaced it.'
          )}
        </Banner>
      )}
      {item.type === 'adr' && item.status !== undefined && <Lifecycle status={item.status} />}
      {item.type === 'adr' && <SupersessionChain id={item.id} chain={view.chain} />}
      {item.type === 'context' && view.context && (
        <ContextPanel item={item} context={view.context} />
      )}
    </>
  )
}

/** Backlinks, outgoing links, and the files that change with the item. */
export function SidePanel({ item }: { readonly item: ItemDetail }) {
  const api = useApi()
  const preview = useQuery(previewQuery(api, item.id))
  const list = (links: ItemDetail['links']) =>
    links.map((l) => (
      <li key={`${l.kind}:${l.path}`}>
        <span className="app-muted">{l.kind.replace('_', ' ')}</span>{' '}
        {l.id ? (
          <Link to="/items/$id" params={{ id: l.id }}>
            {l.id} {l.title}
          </Link>
        ) : (
          <code>{l.path}</code>
        )}
      </li>
    ))
  const co = preview.data?.coChanged
  return (
    <aside className="kn-side" aria-label="Related">
      <section>
        <h2 className="nt-overline">Linked from</h2>
        <ul className="app-link-list">
          {list(item.backlinks)}
          {item.backlinks.length === 0 && <li className="app-muted">Nothing links here</li>}
        </ul>
      </section>
      <section>
        <h2 className="nt-overline">Links to</h2>
        <ul className="app-link-list">
          {list(item.links)}
          {item.links.length === 0 && <li className="app-muted">No outgoing links</li>}
        </ul>
      </section>
      <section>
        <h2 className="nt-overline">
          <Icon name="commit" /> Changes with
        </h2>
        {co === undefined || co === null ? (
          <p className="app-muted">{co === null ? 'Needs git history.' : 'Loading…'}</p>
        ) : (
          <ul className="app-link-list">
            {co.files.map((f) => (
              <li key={f.path}>
                <code>{f.path}</code>{' '}
                <span className="app-muted">
                  {f.commits} of {co.itemCommits} commits
                </span>
              </li>
            ))}
            {co.files.length === 0 && <li className="app-muted">No files change with it yet</li>}
          </ul>
        )}
      </section>
    </aside>
  )
}

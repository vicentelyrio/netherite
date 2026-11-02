import { NotFound } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Banner,
  Button,
  FreshnessLabel,
  type ItemTypeName,
  OrphanTag,
  Progress,
  TypeBadge,
} from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ItemEditor } from '../editor/ItemEditor'
import { useApi } from '../lib/app-context'
import { Markdown } from '../lib/markdown'
import { useNotices } from '../lib/notices'
import { itemQuery, itemsQuery, keys, sourceQuery } from '../lib/queries'
import { noticeFor, useWrite } from '../lib/writes'
import { KnowledgeTop, knowledgeTypes, SidePanel } from './knowledge-item'

const reviewable = new Set(['doc', 'runbook', 'context'])

/**
 * One item, read: its fields, its text rendered with the shared Markdown plugins, and what links
 * to it and from it. The real doc, task and ADR screens (TASK-00039 to 00041) build on this.
 */
export function ItemPage({ id }: { readonly id: string }) {
  const api = useApi()
  const client = useQueryClient()
  const query = useQuery(itemQuery(api, id))
  const reload = () => void client.invalidateQueries({ queryKey: keys.item(id) })
  const [editing, setEditing] = useState(false)

  const review = useWrite(
    api,
    (a, hash: string) =>
      a.call((c) => c.items.markReviewed({ params: { id }, payload: { baseHash: hash } })),
    { reload },
  )

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <div className="app-page">
        <Banner
          variant={missing ? 'warning' : 'danger'}
          title={missing ? `No item ${id}` : 'Could not load this item'}
        >
          {missing
            ? 'It may have been deleted or renumbered.'
            : String((query.error as Error).message ?? query.error)}
        </Banner>
      </div>
    )
  }

  const item = query.data
  const type = item.type as ItemTypeName
  const fresh = item.freshness

  return (
    <article
      className={`app-page app-item${editing ? ' app-item--editing' : ''}`}
      aria-labelledby="item-title"
      data-hash={item.hash}
    >
      <header className="app-item-head">
        <div className="app-item-meta">
          <TypeBadge type={type} />
          <code className="app-id">{item.id}</code>
          {type === 'adr' && item.status !== undefined && (
            <AdrStatusPill status={item.status as AdrStatus} />
          )}
          {type === 'task' && item.state !== undefined && (
            <span className="app-muted">{item.state}</span>
          )}
          {fresh !== null && fresh.state !== 'unknown' && (
            <FreshnessLabel
              state={fresh.state}
              commits={fresh.commits}
              atLeast={fresh.atLeast}
              {...(fresh.since === null ? {} : { since: fresh.since })}
            />
          )}
          {item.orphan && <OrphanTag />}
        </div>
        <Button icon={editing ? 'visibility' : 'edit'} onClick={() => setEditing(!editing)}>
          {editing ? 'Done editing' : 'Edit source'}
        </Button>
        {reviewable.has(type) && !(fresh?.state === 'stale' || fresh?.state === 'drifting') && (
          <Button
            icon="done_all"
            loading={review.isPending}
            onClick={() => review.mutate(item.hash)}
          >
            Mark reviewed
          </Button>
        )}
      </header>

      {knowledgeTypes.has(type) && (
        <KnowledgeTop
          item={item}
          reviewing={review.isPending}
          onReview={() => review.mutate(item.hash)}
        />
      )}

      {item.progress !== null && item.progress.total > 0 && (
        <div className="app-progress">
          <Progress done={item.progress.done} total={item.progress.total} label="Checklist" />
          <span className="app-muted">
            {item.progress.done}/{item.progress.total}
          </span>
        </div>
      )}

      {editing ? <SourceEditor id={id} /> : <Markdown source={item.body} />}

      {knowledgeTypes.has(type) ? (
        <SidePanel item={item} />
      ) : (
        <footer className="app-links">
          <LinkList title="Links" links={item.links} />
          <LinkList title="Linked from" links={item.backlinks} />
        </footer>
      )}
    </article>
  )
}

function LinkList({
  title,
  links,
}: {
  readonly title: string
  readonly links: ReadonlyArray<{
    kind: string
    id?: string | undefined
    title?: string | undefined
    path: string
  }>
}) {
  if (links.length === 0) return null
  return (
    <section>
      <h2 className="nt-overline">{title}</h2>
      <ul className="app-link-list">
        {links.map((link) => (
          <li key={`${link.kind}:${link.path}`}>
            <span className="app-muted">{link.kind.replace('_', ' ')}</span>{' '}
            {link.id ? (
              <Link to="/items/$id" params={{ id: link.id }}>
                {link.id} {link.title}
              </Link>
            ) : (
              <code>{link.path}</code>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The source editor for an item, wired to the server: saving, linting and the items to link to. */
function SourceEditor({ id }: { readonly id: string }) {
  const api = useApi()
  const client = useQueryClient()
  const notices = useNotices()
  const source = useQuery(sourceQuery(api, id))
  const items = useQuery(itemsQuery(api, { limit: 500 }))
  const targets = useMemo(
    () => (items.data?.items ?? []).map((i) => ({ id: i.id, title: i.title, type: i.type })),
    [items.data],
  )

  if (source.isPending) return <p className="app-muted">Loading the source…</p>
  if (source.isError) return <Banner variant="danger" title="Could not load the source" />

  return (
    <ItemEditor
      source={source.data}
      targets={targets}
      lint={async (text) =>
        (await api.call((c) => c.lintText.lintText({ payload: { id, text } }))).diagnostics
      }
      onSave={async (text, baseHash) => {
        try {
          const saved = await api.call((c) =>
            c.items.replaceSource({ params: { id }, payload: { text, baseHash } }),
          )
          void client.invalidateQueries({ queryKey: ['items'] })
          return { text, hash: saved.hash }
        } catch (error) {
          notices.notify(
            noticeFor(error, () => void client.invalidateQueries({ queryKey: keys.source(id) })),
          )
          throw error
        }
      }}
    />
  )
}

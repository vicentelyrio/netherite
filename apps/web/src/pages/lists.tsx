import type { ItemSummary } from '@netherite/api'
import { AdrStatusPill, Card, EmptyState, Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useApi } from '../lib/app-context'
import { itemsQuery } from '../lib/queries'

export interface PageProps {
  readonly title: string
  /** What this screen will be, and which task builds it. */
  readonly arrives: string
  /** The item types to list while the real screen is not there yet. */
  readonly types?: ReadonlyArray<ItemTypeName>
  readonly icon: string
}

function ItemRow({ item }: { readonly item: ItemSummary }) {
  return (
    <Link to="/items/$id" params={{ id: item.id }} className="app-row-link">
      <Card interactive>
        <div className="app-row">
          <TypeBadge type={item.type as ItemTypeName} />
          <code className="app-id">{item.id}</code>
          <span className="app-row-title">{item.title}</span>
          {item.type === 'adr' && item.status !== undefined && (
            <AdrStatusPill
              status={item.status as 'proposed' | 'accepted' | 'deprecated' | 'superseded'}
            />
          )}
          {item.type === 'task' && item.state !== undefined && (
            <span className="app-muted">{item.state}</span>
          )}
        </div>
      </Card>
    </Link>
  )
}

function TypeList({ type }: { readonly type: ItemTypeName }) {
  const api = useApi()
  const query = useQuery(itemsQuery(api, { type }))
  if (query.isPending) return <p className="app-muted">Loading…</p>
  if (query.isError) return <p className="app-muted">Could not load {type}s.</p>
  if (query.data.items.length === 0) return null
  return (
    <section className="app-list">
      {query.data.items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </section>
  )
}

/**
 * A screen whose design is built by a later task. It says so, and lists what the workspace has of
 * the kinds it will show, so the shell can be used and checked against live data meanwhile.
 */
export function Placeholder({ title, arrives, types = [], icon }: PageProps) {
  return (
    <div className="app-page">
      <h1 className="app-title">{title}</h1>
      {types.map((type) => (
        <TypeList key={type} type={type} />
      ))}
      <EmptyState
        icon={icon}
        title={`${title} is on its way`}
        description={arrives}
        actions={
          <span className="app-muted">
            <Icon name="lightbulb" /> The screen follows the design in{' '}
            <code>Netherite Refined</code>.
          </span>
        }
      />
    </div>
  )
}

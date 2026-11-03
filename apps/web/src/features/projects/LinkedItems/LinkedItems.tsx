import type { Board } from '@netherite/api'
import { Card, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import './LinkedItems.css'

/** The items of some types that link to a project: its docs, or its decisions and context. */
export function LinkedItems({
  board,
  types,
  empty,
}: {
  readonly board: Board
  readonly types: ReadonlyArray<string>
  readonly empty: string
}) {
  const items = board.linked.filter((i) => types.includes(i.type))
  if (items.length === 0) return <p className="app-muted">{empty}</p>
  return (
    <section className="app-list">
      {items.map((item) => (
        <Link key={item.id} to="/items/$id" params={{ id: item.id }} className="app-row-link">
          <Card interactive>
            <div className="app-row">
              <TypeBadge type={item.type as ItemTypeName} />
              <code className="app-id">{item.id}</code>
              <span className="app-row-title">{item.title}</span>
            </div>
          </Card>
        </Link>
      ))}
    </section>
  )
}

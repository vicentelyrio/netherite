import type { ItemDetail } from '@netherite/api'
import { Link } from '@tanstack/react-router'
import { useI18nContext } from '@/infrastructure/i18n'
import './TaskRelated.css'
import '../shared.css'

export function TaskRelated({ task }: { readonly task: ItemDetail }) {
  const { LL } = useI18nContext()
  const related = [
    ...task.links.filter((l) => l.kind !== 'implements' && l.kind !== 'belongs_to'),
    ...task.backlinks.filter((l) => l.kind !== 'belongs_to'),
  ].filter((l) => l.id !== undefined)
  return (
    <section className="drawer-section" aria-label={LL.tasks.related.title()}>
      <h3 className="drawer-h">{LL.tasks.related.title()}</h3>
      <ul className="app-link-list">
        {related.map((l) => (
          <li key={`${l.kind}:${l.path}`}>
            <span className="app-muted">{l.kind.replace('_', ' ')}</span>{' '}
            <Link to="/items/$id" params={{ id: l.id as string }}>
              {l.id} {l.title}
            </Link>
          </li>
        ))}
        {related.length === 0 && <li className="drawer-empty">{LL.tasks.related.none()}</li>}
      </ul>
    </section>
  )
}

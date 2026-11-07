import type { ItemDetail } from '@netherite/api'
import { Link } from '@tanstack/react-router'
import { linkKindLabel, useI18nContext } from '@/infrastructure/i18n'
import { DrawerHeading, DrawerSection } from '../DrawerSection'
import './TaskRelated.css'

export function TaskRelated({ task }: { readonly task: ItemDetail }) {
  const { LL } = useI18nContext()
  const related = [
    ...task.links.filter((l) => l.kind !== 'implements' && l.kind !== 'belongs_to'),
    ...task.backlinks.filter((l) => l.kind !== 'belongs_to'),
  ].filter((l) => l.id !== undefined)
  return (
    <DrawerSection label={LL.tasks.related.title()}>
      <DrawerHeading>{LL.tasks.related.title()}</DrawerHeading>
      <ul className="app-link-list">
        {related.map((l) => (
          <li key={`${l.kind}:${l.path}`}>
            <span className="app-muted">{linkKindLabel(LL, l.kind)}</span>{' '}
            <Link to="/items/$id" params={{ id: l.id as string }}>
              {l.id} {l.title}
            </Link>
          </li>
        ))}
        {related.length === 0 && <li className="drawer-empty">{LL.tasks.related.none()}</li>}
      </ul>
    </DrawerSection>
  )
}

import { Link } from '@tanstack/react-router'
import type { LinkInfo } from './ItemLinks.types'

export function LinkList({
  title,
  links,
}: {
  readonly title: string
  readonly links: ReadonlyArray<LinkInfo>
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

import { Link } from '@tanstack/react-router'
import { useI18nContext } from '@/infrastructure/i18n'
import './ItemLinks.css'

interface LinkInfo {
  readonly kind: string
  readonly id?: string | undefined
  readonly title?: string | undefined
  readonly path: string
}

function LinkList({
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

/** What an item links to and what links to it. */
export function ItemLinks({
  links,
  backlinks,
}: {
  readonly links: ReadonlyArray<LinkInfo>
  readonly backlinks: ReadonlyArray<LinkInfo>
}) {
  const { LL } = useI18nContext()
  return (
    <footer className="app-links">
      <LinkList title={LL.items.links()} links={links} />
      <LinkList title={LL.items.linkedFrom()} links={backlinks} />
    </footer>
  )
}

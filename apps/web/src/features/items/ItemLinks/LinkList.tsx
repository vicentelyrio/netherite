import { Link } from '@tanstack/react-router'
import { linkKindLabel, useI18nContext } from '@/infrastructure/i18n'
import type { LinkInfo } from './ItemLinks.types'

export function LinkList({
  title,
  links,
}: {
  readonly title: string
  readonly links: ReadonlyArray<LinkInfo>
}) {
  const { LL } = useI18nContext()
  if (links.length === 0) return null
  return (
    <section>
      <h2 className="nt-overline">{title}</h2>
      <ul className="app-link-list">
        {links.map((link) => (
          <li key={`${link.kind}:${link.path}`}>
            <span className="app-muted">{linkKindLabel(LL, link.kind)}</span>{' '}
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

import { useI18nContext } from '@/infrastructure/i18n'
import type { LinkInfo } from './ItemLinks.types'
import { LinkList } from './LinkList'
import './ItemLinks.css'

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

import { useRouter } from '@tanstack/react-router'
import type { ComponentProps, MouseEvent } from 'react'
import { safeUrl } from './safeUrl'

export function MarkdownAnchor({
  href,
  children,
  node: _node,
  ...rest
}: ComponentProps<'a'> & { node?: unknown }) {
  const wiki = 'data-wikilink' in rest
  const safe = safeUrl(href)
  const router = useRouter({ warn: false })
  if (safe === undefined) return <span className="md-dead-link">{children}</span>
  const inside = !safe.external && safe.href.startsWith('/')
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    const plain =
      event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    if (event.defaultPrevented || !plain || !router) return
    event.preventDefault()
    void router.navigate({ href: safe.href })
  }
  return (
    <a
      {...rest}
      href={safe.href}
      {...(wiki ? { className: 'md-wikilink' } : {})}
      {...(inside ? { onClick: follow } : {})}
      {...(safe.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

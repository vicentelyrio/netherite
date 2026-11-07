import type { ComponentProps } from 'react'
import { safeUrl } from './safeUrl'

export function MarkdownImage({
  src,
  alt,
  node: _node,
}: ComponentProps<'img'> & { node?: unknown }) {
  const safe = typeof src === 'string' ? safeUrl(src) : undefined
  if (safe === undefined || !/^https?:/.test(safe.href))
    return <span className="md-dead-link">{alt || 'image'}</span>
  return <img src={safe.href} alt={alt ?? ''} loading="lazy" referrerPolicy="no-referrer" />
}

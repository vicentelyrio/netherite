import { createProcessor, type WikiLink } from '@netherite/markdown'
import { useRouter } from '@tanstack/react-router'
import type { Element, Nodes, Root } from 'hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { ComponentProps, MouseEvent, ReactElement } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import remarkRehype from 'remark-rehype'

const itemId = /^[A-Z]{2,8}-\d{3,}$/

/** Where a `[[wikilink]]` goes: an item by ID, otherwise a search for what it says. */
export const wikiHref = (target: string) =>
  itemId.test(target)
    ? `/items/${encodeURIComponent(target)}`
    : `/knowledge?q=${encodeURIComponent(target)}`

/**
 * The same processor the index uses (ADR-00011, ADR-00018), plus the step that makes HTML. Raw
 * HTML in a Markdown file is dropped, not rendered: files can come from anywhere (a pulled branch,
 * an agent), and the app runs with the person's session token.
 */
const processor = createProcessor().use(remarkRehype, {
  handlers: {
    // Frontmatter is shown elsewhere, as fields.
    yaml: () => undefined,
    wikiLink: (_state, node: WikiLink): Element => {
      const { target, heading, label } = node.data
      return {
        type: 'element',
        tagName: 'a',
        properties: {
          href: wikiHref(target) + (heading ? `#${encodeURIComponent(heading)}` : ''),
          'data-wikilink': target,
        },
        children: [{ type: 'text', value: label ?? (heading ? `${target} › ${heading}` : target) }],
      }
    },
  },
})

/** Links we will follow: the web, mail, and places inside this app. Everything else is inert. */
export const safeUrl = (
  url: string | undefined,
): { href: string; external: boolean } | undefined => {
  if (url === undefined || url === '') return undefined
  const trimmed = url.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//'))
    return { href: trimmed, external: false }
  if (trimmed.startsWith('#')) return { href: trimmed, external: false }
  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:'
    ) {
      return { href: parsed.href, external: parsed.protocol !== 'mailto:' }
    }
  } catch {
    // not an absolute URL: treat a bare relative path as unsafe too, since there is no file to open
  }
  return undefined
}

function Anchor({
  href,
  children,
  node: _node,
  ...rest
}: ComponentProps<'a'> & { node?: unknown }) {
  const wiki = 'data-wikilink' in rest
  const safe = safeUrl(href)
  // Inside the app a link is followed by the router, so the page is not reloaded.
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

/** Images from the web or a data URL only: a relative path would point at the app, not the repo. */
function Image({ src, alt, node: _node }: ComponentProps<'img'> & { node?: unknown }) {
  const safe = typeof src === 'string' ? safeUrl(src) : undefined
  if (safe === undefined || !/^https?:/.test(safe.href))
    return <span className="md-dead-link">{alt || 'image'}</span>
  return <img src={safe.href} alt={alt ?? ''} loading="lazy" referrerPolicy="no-referrer" />
}

const components = { a: Anchor, img: Image }

/** Markdown text to React elements. The title heading is part of the text, as in the file. */
export const renderMarkdown = (source: string): ReactElement => {
  const tree = processor.runSync(processor.parse(source), source) as Nodes as Root
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: components as never,
  }) as ReactElement
}

/** Rendered Markdown, styled as a document. */
export function Markdown({ source }: { readonly source: string }) {
  return <div className="md">{renderMarkdown(source)}</div>
}

import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Markdown, renderMarkdown, safeUrl, wikiHref } from '../src/lib/markdown'

const html = (source: string) => {
  const { container } = render(<Markdown source={source} />)
  return container.querySelector('.md') as HTMLElement
}

describe('wikilinks, with the same plugin the index uses', () => {
  test('an item ID links to its page, and shows the ID', () => {
    const md = html('See [[ADR-00007]].')
    const link = md.querySelector('a') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/items/ADR-00007')
    expect(link).toHaveTextContent('ADR-00007')
    expect(link).toHaveAttribute('data-wikilink', 'ADR-00007')
    expect(link).toHaveClass('md-wikilink')
  })

  test('a label replaces the text, and a heading is shown and kept in the URL', () => {
    const md = html('[[ADR-00007|the git decision]] and [[TASK-00001#Notes]]')
    const [labelled, headed] = [...md.querySelectorAll('a')]
    expect(labelled).toHaveTextContent('the git decision')
    expect(headed?.getAttribute('href')).toBe('/items/TASK-00001#Notes')
    expect(headed).toHaveTextContent('TASK-00001 › Notes')
  })

  test('a title or alias, which is not an ID, goes to a search', () => {
    expect(wikiHref('Core library')).toBe('/knowledge?q=Core%20library')
    expect(wikiHref('ADR-00007')).toBe('/items/ADR-00007')
  })

  test('wikilinks inside code are text, not links', () => {
    const md = html('`[[ADR-00001]]`\n\n```\n[[ADR-00002]]\n```\n')
    expect(md.querySelectorAll('a')).toHaveLength(0)
    expect(md.textContent).toContain('[[ADR-00001]]')
    expect(md.textContent).toContain('[[ADR-00002]]')
  })

  test('an escaped wikilink is left alone', () => {
    const md = html('\\[[ADR-00001]]')
    expect(md.querySelectorAll('a')).toHaveLength(0)
  })
})

describe('GitHub Flavored Markdown', () => {
  test('task lists are read-only checkboxes, checked as written', () => {
    const md = html('- [x] done\n- [ ] todo\n')
    const boxes = [...md.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
    expect(boxes.map((b) => b.checked)).toEqual([true, false])
    expect(boxes.every((b) => b.disabled)).toBe(true)
  })

  test('tables, strikethrough and bare URLs', () => {
    const md = html('| a | b |\n|---|---|\n| 1 | 2 |\n\n~~gone~~ https://example.com/x\n')
    expect(md.querySelector('table')).not.toBeNull()
    expect(md.querySelectorAll('td')).toHaveLength(2)
    expect(md.querySelector('del')).toHaveTextContent('gone')
    expect(md.querySelector('a[href="https://example.com/x"]')).not.toBeNull()
  })

  test('headings, code blocks and quotes', () => {
    const md = html('# Title\n\n## Section\n\n> quoted\n\n```ts\nconst x = 1\n```\n')
    expect(md.querySelector('h1')).toHaveTextContent('Title')
    expect(md.querySelector('h2')).toHaveTextContent('Section')
    expect(md.querySelector('blockquote')).toHaveTextContent('quoted')
    expect(md.querySelector('pre code')).toHaveTextContent('const x = 1')
  })

  test('frontmatter, if a file is rendered whole, is not shown', () => {
    const md = html('---\nid: TASK-00001\n---\n\n# Hello\n')
    expect(md.textContent).not.toContain('TASK-00001')
    expect(md.querySelector('h1')).toHaveTextContent('Hello')
  })
})

describe('files are not trusted', () => {
  test('raw HTML is dropped, not run', () => {
    const md = html(
      '<script>window.hacked = 1</script>\n\n<img src=x onerror="window.hacked = 2">\n\nText <b onclick="x()">bold</b>\n',
    )
    expect(md.querySelector('script')).toBeNull()
    expect(md.querySelector('img')).toBeNull()
    expect(md.querySelector('[onclick]')).toBeNull()
    expect((window as unknown as { hacked?: number }).hacked).toBeUndefined()
  })

  test.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:x',
    '//evil.example/x',
    'file:///etc/passwd',
    '',
  ])('a link to %j goes nowhere', (url) => {
    expect(safeUrl(url)).toBeUndefined()
    const md = html(`[click me](${url || '<>'})`)
    expect(md.querySelector('a')).toBeNull()
    expect(md).toHaveTextContent('click me')
  })

  test('web and mail links are kept; web links open safely in a new tab', () => {
    const md = html(
      '[a](https://example.com/p?q=1) [b](mailto:ada@example.com) [c](/items/TASK-00001) [d](#top)',
    )
    const links = [...md.querySelectorAll('a')]
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      'https://example.com/p?q=1',
      'mailto:ada@example.com',
      '/items/TASK-00001',
      '#top',
    ])
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
    expect(links[1]).not.toHaveAttribute('target')
    expect(links[2]).not.toHaveAttribute('target')
  })

  test('images come from the web only, and are not told where the reader came from', () => {
    const md = html('![ok](https://example.com/a.png) ![local](./a.png) ![js](javascript:alert(1))')
    const images = [...md.querySelectorAll('img')]
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(md).toHaveTextContent('local')
    expect(md).toHaveTextContent('js')
  })

  test('renders to React elements, so there is no innerHTML to get wrong', () => {
    const element = renderMarkdown('# Hi')
    render(element)
    expect(screen.getByRole('heading', { name: 'Hi' })).toBeInTheDocument()
  })
})

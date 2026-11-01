import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fixturePath } from '@netherite/testing'
import { describe, expect, test } from 'vitest'
import { parseMarkdown, slugify } from '../src/index'

const fixture = (path: string) =>
  readFileSync(join(fixturePath('basic'), 'netherite', path), 'utf8')

describe('frontmatter', () => {
  test('is parsed with its offsets', () => {
    const source = '---\nid: TASK-00001\ntags: [a, b]\n---\n\n# Title\n'
    const { frontmatter, bodyStart } = parseMarkdown(source)
    expect(frontmatter?.data).toEqual({ id: 'TASK-00001', tags: ['a', 'b'] })
    expect(source.slice(frontmatter?.start, frontmatter?.end)).toBe(
      '---\nid: TASK-00001\ntags: [a, b]\n---',
    )
    expect(source.slice(bodyStart).trim()).toBe('# Title')
  })

  test('a file without frontmatter has none', () => {
    const parsed = parseMarkdown('# Just a heading\n')
    expect(parsed.frontmatter).toBeUndefined()
    expect(parsed.bodyStart).toBe(0)
  })

  test('YAML errors carry the line in the whole file', () => {
    const source = '---\nid: ok\ntitle: [unclosed\nother: 1\n---\nBody\n'
    const { frontmatter } = parseMarkdown(source)
    expect(frontmatter?.data).toBeUndefined()
    expect(frontmatter?.errors.length).toBeGreaterThan(0)
    expect(frontmatter?.errors[0]?.line).toBeGreaterThanOrEqual(3)
  })

  test('a horizontal rule in the body is not frontmatter', () => {
    const parsed = parseMarkdown('Intro\n\n---\n\nMore\n')
    expect(parsed.frontmatter).toBeUndefined()
  })

  test('wikilinks inside frontmatter are not body links', () => {
    const parsed = parseMarkdown('---\nrelated: "[[X-1]]"\n---\nBody [[Y-2]]\n')
    expect(parsed.links.map((l) => l.target)).toEqual(['Y-2'])
  })

  test('CRLF files parse the same', () => {
    const source = '---\r\nid: A-1\r\n---\r\n\r\n- [ ] one\r\n- [x] two\r\n'
    const parsed = parseMarkdown(source)
    expect(parsed.frontmatter?.data).toEqual({ id: 'A-1' })
    expect(parsed.checklist.map((c) => c.checked)).toEqual([false, true])
  })
})

describe('headings', () => {
  const source = `${['# One', 'a', '## Two', 'b', '### Three', 'c', '## Two', 'd', '# Four', 'e'].join('\n')}\n`
  const { headings } = parseMarkdown(source)

  test('have depth, text and unique slugs', () => {
    expect(headings.map((h) => [h.depth, h.text, h.slug])).toEqual([
      [1, 'One', 'one'],
      [2, 'Two', 'two'],
      [3, 'Three', 'three'],
      [2, 'Two', 'two-1'],
      [1, 'Four', 'four'],
    ])
  })

  test('sections end at the next heading of the same or higher level', () => {
    const section = (i: number) =>
      source.slice(headings[i]?.position.start.offset, headings[i]?.sectionEnd)
    expect(section(0)).toBe('# One\na\n## Two\nb\n### Three\nc\n## Two\nd\n')
    expect(section(1)).toBe('## Two\nb\n### Three\nc\n')
    expect(section(2)).toBe('### Three\nc\n')
    expect(section(4)).toBe('# Four\ne\n')
  })

  test('heading text drops formatting and keeps link labels', () => {
    const [heading] = parseMarkdown('## The `code` and **bold** with [[A-1|a link]]\n').headings
    expect(heading?.text).toBe('The code and bold with a link')
  })

  test('slugify matches GitHub for common cases', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
    expect(slugify('Data model & schemas')).toBe('data-model--schemas')
    expect(slugify('Ação rápida')).toBe('ação-rápida')
  })
})

describe('checklist', () => {
  const source = [
    '# Plan',
    '',
    '- [x] Done thing',
    '- [ ] Open thing',
    '  - [ ] Nested open',
    '- plain bullet',
    '',
    '## Later',
    '',
    '1. [X] Numbered done',
    '2. [ ] Numbered open',
    '',
    'Text with [ ] not a task',
  ].join('\n')
  const { checklist } = parseMarkdown(source)

  test('lists task items only, with state, text and section', () => {
    expect(checklist.map((c) => [c.checked, c.text, c.depth, c.section])).toEqual([
      [true, 'Done thing', 0, 'Plan'],
      [false, 'Open thing', 0, 'Plan'],
      [false, 'Nested open', 1, 'Plan'],
      [true, 'Numbered done', 0, 'Later'],
      [false, 'Numbered open', 0, 'Later'],
    ])
  })

  test('toggleOffset points at the character inside the brackets', () => {
    for (const { toggleOffset, checked } of checklist) {
      expect(source.slice(toggleOffset - 1, toggleOffset + 2)).toMatch(/^\[[ xX]\]$/)
      expect(source[toggleOffset] === ' ').toBe(!checked)
    }
  })

  test('splicing at toggleOffset toggles only that item', () => {
    const offset = checklist[1]?.toggleOffset ?? -1
    const toggled = `${source.slice(0, offset)}x${source.slice(offset + 1)}`
    const after = parseMarkdown(toggled).checklist.map((c) => c.checked)
    expect(after).toEqual([true, true, false, true, false])
    expect(toggled.replace('[x] Open', '[ ] Open')).toBe(source)
  })

  test('item positions cover the item text', () => {
    const [first] = checklist
    expect(source.slice(first?.position.start.offset, first?.position.end.offset)).toBe(
      '- [x] Done thing',
    )
  })

  test('checklist in code blocks is ignored', () => {
    expect(parseMarkdown('```\n- [ ] not a task\n```\n').checklist).toEqual([])
  })
})

describe('plain text', () => {
  test('joins blocks with newlines and excludes frontmatter', () => {
    const { text } = parseMarkdown(
      '---\nid: X-1\n---\n# Title\n\nSome **bold** text with [[A-1|a link]].\n\n- item `code`\n',
    )
    expect(text).toBe('Title\nSome bold text with a link.\nitem code')
  })

  test('includes code block content so it stays searchable', () => {
    expect(parseMarkdown('```ts\nconst x = 1\n```\n').text).toBe('const x = 1')
  })

  test('uses the link target when there is no label', () => {
    expect(parseMarkdown('See [[ADR-00007]].\n').text).toBe('See ADR-00007.')
  })
})

describe('fixtures/basic', () => {
  test('DOC-00001 links to its task and context doc', () => {
    const { links, frontmatter } = parseMarkdown(fixture('docs/DOC-00001-app-overview.md'))
    expect(links.map((l) => l.target)).toEqual(['TASK-00001', 'CTX-00001'])
    expect(frontmatter?.data).toMatchObject({ id: 'DOC-00001' })
  })

  test('TASK-00002 has one done and two open checklist items', () => {
    const { checklist } = parseMarkdown(fixture('tasks/TASK-00002-add-the-cli.md'))
    expect(checklist.map((c) => [c.text, c.checked])).toEqual([
      ['Parse arguments', true],
      ['Print help', false],
      ['Add a --json flag', false],
    ])
  })

  test('the broken-link fixture links to TASK-00404', () => {
    const { links } = parseMarkdown(fixture('tasks/TASK-00090-broken-link.md'))
    expect(links.map((l) => l.target)).toEqual(['TASK-00404'])
  })

  test('every fixture parses with valid frontmatter', async () => {
    const { readdirSync } = await import('node:fs')
    const walk = (dir: string): string[] =>
      readdirSync(join(fixturePath('basic'), 'netherite', dir), { withFileTypes: true }).map((e) =>
        join(dir, e.name),
      )
    for (const dir of ['goals', 'projects', 'tasks', 'adr', 'docs', 'context', 'runbooks']) {
      for (const path of walk(dir)) {
        const parsed = parseMarkdown(fixture(path))
        expect(parsed.frontmatter?.errors, path).toEqual([])
        expect(parsed.frontmatter?.data, path).toBeDefined()
      }
    }
  })
})

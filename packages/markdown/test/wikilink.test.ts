import { describe, expect, test } from 'vitest'
import { findWikiLinks, parseMarkdown } from '../src/index'

const links = (source: string) => parseMarkdown(source).links

describe('wikilinks', () => {
  test('plain, labelled and heading forms', () => {
    const found = links('See [[ADR-00007]], [[ADR-00007|the git ADR]] and [[Freshness#Baseline]].')
    expect(found.map(({ target, heading, label }) => ({ target, heading, label }))).toEqual([
      { target: 'ADR-00007', heading: undefined, label: undefined },
      { target: 'ADR-00007', heading: undefined, label: 'the git ADR' },
      { target: 'Freshness', heading: 'Baseline', label: undefined },
    ])
  })

  test('heading and label together', () => {
    const [link] = links('[[Notes#Plan|the plan]]')
    expect(link).toMatchObject({ target: 'Notes', heading: 'Plan', label: 'the plan' })
  })

  test('targets and labels are trimmed; titles may contain spaces', () => {
    const [link] = links('[[ Data model | schemas ]]')
    expect(link).toMatchObject({ target: 'Data model', label: 'schemas' })
  })

  test('positions point at the exact source text', () => {
    const source =
      'First line\n\nLead [[ADR-00001]] mid [[TASK-00002|x]] end\n- item [[DOC-00003]]\n'
    for (const link of links(source)) {
      const { start, end } = link.position
      expect(source.slice(start.offset, end.offset)).toBe(link.raw)
    }
    const [first] = links(source)
    expect(first?.position.start).toMatchObject({ line: 3, column: 6 })
  })

  test('works in headings, lists, tables, emphasis and block quotes', () => {
    const source = [
      '# Title [[A-1]]',
      '',
      '- item [[B-2]]',
      '',
      '| col |',
      '| --- |',
      '| [[C-3]] |',
      '',
      '**bold [[D-4]]** and _[[E-5]]_',
      '',
      '> quote [[F-6]]',
    ].join('\n')
    expect(links(source).map((l) => l.target)).toEqual(['A-1', 'B-2', 'C-3', 'D-4', 'E-5', 'F-6'])
  })

  test('ignores code spans and code blocks', () => {
    const source = [
      'Inline `[[NOT-1]]` is code.',
      '',
      '```md',
      '[[NOT-2]]',
      '```',
      '',
      '    [[NOT-3]]',
      '',
      'Real [[YES-1]].',
    ].join('\n')
    expect(links(source).map((l) => l.target)).toEqual(['YES-1'])
  })

  test('ignores escaped brackets', () => {
    expect(links('\\[[NOT-1]] and [[YES-1]]').map((l) => l.target)).toEqual(['YES-1'])
  })

  test('ignores empty and malformed links', () => {
    expect(links('[[]] [[ ]] [[a] [b]] [[open')).toEqual([])
  })

  test('does not span lines', () => {
    expect(links('[[a\nb]]')).toEqual([])
  })

  test('several links on one line keep their own positions', () => {
    const source = '[[A-1]][[B-2]] [[C-3]]'
    expect(
      links(source).map((l) => source.slice(l.position.start.offset, l.position.end.offset)),
    ).toEqual(['[[A-1]]', '[[B-2]]', '[[C-3]]'])
  })

  test('findWikiLinks works on raw text', () => {
    expect(findWikiLinks('x [[a]] y').map((l) => [l.start, l.end])).toEqual([[2, 7]])
  })

  test('wikilinks become wikiLink nodes in the tree', () => {
    const { tree } = parseMarkdown('Go [[A-1|here]] now')
    const paragraph = tree.children[0]
    expect(paragraph?.type).toBe('paragraph')
    const kinds = paragraph && 'children' in paragraph ? paragraph.children.map((c) => c.type) : []
    expect(kinds).toEqual(['text', 'wikiLink', 'text'])
  })
})

import { describe, expect, test } from 'vitest'
import { fileSlug, itemFileName, itemRelativePath, typeFolders } from '../src/index'

describe('fileSlug', () => {
  test.each([
    ['Use GNU Stow', 'use-gnu-stow'],
    ['  Spaces   and\ttabs ', 'spaces-and-tabs'],
    [
      'Edits change only the targeted lines, never reformat!',
      'edits-change-only-the-targeted-lines-never-reformat',
    ],
    ['Ação rápida: coração', 'acao-rapida-coracao'],
    ['Café au lait', 'cafe-au-lait'],
    ['v2.0 release (final)', 'v2-0-release-final'],
    ['日本語のタイトル', '日本語のタイトル'],
    ['A/B tests', 'a-b-tests'],
  ] as Array<[string, string]>)('%s -> %s', (title, slug) => {
    expect(fileSlug(title)).toBe(slug)
  })

  test('falls back for titles with no letters or digits', () => {
    expect(fileSlug('')).toBe('untitled')
    expect(fileSlug('!!! ???')).toBe('untitled')
  })

  test('cuts long titles at a word boundary', () => {
    const slug = fileSlug('word '.repeat(40))
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug).toMatch(/^(word-)*word$/)
  })

  test('truncates a single very long word', () => {
    expect(fileSlug('x'.repeat(100))).toHaveLength(60)
  })

  test('is safe as a file name', () => {
    for (const title of ['../../etc/passwd', 'a\\b:c*d?e"f<g>h|i', 'con.txt\u0000']) {
      expect(fileSlug(title)).toMatch(/^[\p{L}\p{N}-]+$/u)
    }
  })
})

describe('item file names', () => {
  test('are <ID>-<slug>.md', () => {
    expect(itemFileName('ADR-00007', 'Use GNU Stow')).toBe('ADR-00007-use-gnu-stow.md')
  })

  test('paths put each type in its folder', () => {
    expect(itemRelativePath('ADR-00007', 'Use GNU Stow')).toBe('adr/ADR-00007-use-gnu-stow.md')
    expect(itemRelativePath('TASK-00001', 'Do it')).toBe('tasks/TASK-00001-do-it.md')
    expect(itemRelativePath('CTX-00001', 'Rules')).toBe('context/CTX-00001-rules.md')
    expect(itemRelativePath('RUN-00001', 'Release')).toBe('runbooks/RUN-00001-release.md')
  })

  test('every type has a folder', () => {
    expect(Object.keys(typeFolders).sort()).toEqual(
      ['adr', 'context', 'doc', 'goal', 'project', 'runbook', 'task'].sort(),
    )
  })

  test('a path for something that is not an id throws', () => {
    expect(() => itemRelativePath('NOTE-1', 'x')).toThrow('Not an item ID')
  })
})

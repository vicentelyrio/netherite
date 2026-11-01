import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseMarkdown } from '@netherite/markdown'
import { generateWorkspaceFiles } from '@netherite/testing'
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'
import { parse } from 'yaml'
import {
  appendToList,
  findFrontmatter,
  removeFromList,
  setField,
  toggleCheck,
  unsetField,
} from '../src/index'
import { fixturePath, scanFixture } from './helpers'

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runSync(effect)
const data = (source: string) => parseMarkdown(source).frontmatter?.data as Record<string, unknown>

const fixtureSources = async () =>
  (await scanFixture()).map((item) => ({
    path: item.path,
    source: readFileSync(join(fixturePath('basic'), item.path), 'utf8'),
  }))

const lines = (text: string) => text.split('\n')

/** Number of lines that differ once the shared first and last lines are removed. */
const changedLines = (before: string, after: string) => {
  const a = lines(before)
  const b = lines(after)
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  return Math.max(endA - start, endB - start)
}

describe('findFrontmatter', () => {
  test('agrees with the parser about where the frontmatter is', async () => {
    for (const { path, source } of await fixtureSources()) {
      const span = findFrontmatter(source)
      const parsed = parseMarkdown(source).frontmatter
      expect(span !== undefined, path).toBe(parsed !== undefined)
      if (span && parsed) {
        expect(source.slice(span.innerStart, span.innerEnd).trim(), path).toBe(parsed.raw.trim())
      }
    }
  })

  test.each([
    ['no frontmatter', '# Title\n'],
    ['not at the top', '\n---\nid: x\n---\n'],
    ['unclosed', '---\nid: x\n'],
    ['a rule in the body', 'text\n\n---\n\nmore\n'],
  ])('finds none for %s', (_name, source) => {
    expect(findFrontmatter(source)).toBeUndefined()
  })

  test('handles trailing spaces on the fences and an immediate close', () => {
    expect(findFrontmatter('---  \nid: x\n---  \nbody')).toBeDefined()
    const empty = findFrontmatter('---\n---\nbody')
    expect(empty?.innerStart).toBe(empty?.innerEnd)
  })
})

describe('edits across every fixture file', () => {
  test('setField changes only that field in the parsed data, and only its lines in the text', async () => {
    for (const { path, source } of await fixtureSources()) {
      const before = data(source)
      for (const key of Object.keys(before)) {
        if (typeof before[key] === 'object') continue
        const after = run(setField(source, key, 'changed value'))
        expect(data(after), `${path} ${key}`).toEqual({ ...before, [key]: 'changed value' })
        expect(changedLines(source, after), `${path} ${key}`).toBeLessThanOrEqual(1)
        expect(parseMarkdown(after).frontmatter?.errors).toEqual([])
      }
    }
  })

  test('unsetField removes just that field', async () => {
    for (const { path, source } of await fixtureSources()) {
      const before = data(source)
      for (const key of Object.keys(before)) {
        const after = run(unsetField(source, key))
        const { [key]: _removed, ...rest } = before
        expect(data(after) ?? {}, `${path} ${key}`).toEqual(rest)
      }
    }
  })

  test('appendToList then removeFromList restores the original text', async () => {
    for (const { path, source } of await fixtureSources()) {
      const before = data(source)
      for (const [key, value] of Object.entries(before)) {
        if (!Array.isArray(value)) continue
        const added = run(appendToList(source, key, 'zz-new-value'))
        expect(data(added)[key], `${path} ${key}`).toEqual([...value, 'zz-new-value'])
        expect(run(removeFromList(added, key, 'zz-new-value')), `${path} ${key}`).toBe(source)
      }
    }
  })

  test('the body is never touched by a frontmatter edit', async () => {
    for (const { path, source } of await fixtureSources()) {
      const after = run(setField(source, 'zz_new', 'x'))
      const body = (text: string) => text.slice(parseMarkdown(text).bodyStart)
      expect(body(after), path).toBe(body(source))
    }
  })

  test('toggling every checklist item one by one only flips that item', async () => {
    for (const { path, source } of await fixtureSources()) {
      const items = parseMarkdown(source).checklist
      for (const [i, item] of items.entries()) {
        const after = run(toggleCheck(source, i))
        const next = parseMarkdown(after).checklist
        expect(
          next.map((c) => c.checked),
          `${path} ${i}`,
        ).toEqual(items.map((c, j) => (j === i ? !item.checked : c.checked)))
        expect(changedLines(source, after)).toBe(1)
        expect(run(toggleCheck(after, i)), `${path} ${i}`).toBe(source)
      }
    }
  })
})

describe('on generated workspaces', () => {
  const files = Object.entries(generateWorkspaceFiles({ count: 300, seed: 21 }))

  test('a field edit round-trips through the parser for every file', () => {
    for (const [path, source] of files) {
      const after = run(setField(source, 'title', 'Edited: a "title"'))
      expect(data(after).title, path).toBe('Edited: a "title"')
      expect(changedLines(source, after), path).toBeLessThanOrEqual(1)
    }
  })

  test('adding, then removing, a list entry leaves files as they were', () => {
    for (const [path, source] of files) {
      const added = run(appendToList(source, 'aliases', 'extra-alias'))
      expect(run(removeFromList(added, 'aliases', 'extra-alias')), path).toBe(source)
    }
  })

  test('YAML the editor wrote can be read by an independent YAML parser', () => {
    for (const [path, source] of files.slice(0, 50)) {
      const titled = run(setField(source, 'title', 'x: y'))
      const after = run(appendToList(titled, 'tags', 'new'))
      const front = after.slice(4, after.indexOf('\n---\n', 4))
      expect(() => parse(front), path).not.toThrow()
      expect(parse(front).tags, path).toEqual(['new'])
    }
  })
})

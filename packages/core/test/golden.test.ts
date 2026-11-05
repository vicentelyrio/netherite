import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  appendSection,
  appendToList,
  appendToSection,
  EditError,
  removeFromList,
  replaceSection,
  setField,
  toggleCheck,
  unsetField,
} from '../src/index'

const root = join(__dirname, 'golden')
const update = process.env.GOLDEN_UPDATE === '1'

type Op = { op: string; expectError?: string; [key: string]: unknown }

const apply = (source: string, op: Op): Effect.Effect<string, EditError> => {
  const arg = <T>(key: string) => op[key] as T
  switch (op.op) {
    case 'setField':
      return setField(source, arg('name'), arg('value'), arg('options'))
    case 'unsetField':
      return unsetField(source, arg('name'))
    case 'appendToList':
      return appendToList(source, arg('name'), arg('value'), arg('options'))
    case 'removeFromList':
      return removeFromList(source, arg('name'), arg('value'))
    case 'toggleCheck':
      return toggleCheck(source, arg('which'), arg('checked'))
    case 'replaceSection':
      return replaceSection(source, arg('which'), arg('content'), arg('options'))
    case 'appendToSection':
      return appendToSection(source, arg('which'), arg('content'))
    case 'appendSection':
      return appendSection(source, arg('heading'), arg('content'), arg('options'))
    default:
      throw new Error(`Unknown op ${op.op}`)
  }
}

const isIdempotent = (op: Op) => {
  switch (op.op) {
    case 'setField':
    case 'unsetField':
    case 'removeFromList':
    case 'replaceSection':
      return true
    case 'appendToList':
      return (op.options as { unique?: boolean } | undefined)?.unique !== false
    case 'toggleCheck':
      return op.checked !== undefined
    default:
      return false
  }
}

const read = (dir: string, file: string) => readFileSync(join(dir, file), 'utf8')
const cases = readdirSync(root).sort()

/** Lines that differ between two texts, ignoring the common start and end. */
const changedRegion = (before: string, after: string) => {
  const a = before.split('\n')
  const b = after.split('\n')
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  return { removed: a.slice(start, endA), added: b.slice(start, endB) }
}

describe('golden files', () => {
  test('there are golden cases', () => {
    expect(cases.length).toBeGreaterThan(80)
  })

  test.each(cases)('%s', async (name) => {
    const dir = join(root, name)
    const input = read(dir, 'input.md')
    const op = JSON.parse(read(dir, 'op.json')) as Op

    if (op.expectError !== undefined) {
      const error = await Effect.runPromise(Effect.flip(apply(input, op)))
      expect(error).toBeInstanceOf(EditError)
      expect(error.reason).toBe(op.expectError)
      expect(existsSync(join(dir, 'expected.md'))).toBe(false)
      return
    }

    const output = await Effect.runPromise(apply(input, op))
    if (update) writeFileSync(join(dir, 'expected.md'), output)
    expect(output).toBe(read(dir, 'expected.md'))
    if (isIdempotent(op)) {
      const again = await Effect.runPromise(apply(output, op))
      expect(again).toBe(output)
    }
  })

  test('every edit leaves line endings consistent', async () => {
    for (const name of cases) {
      const dir = join(root, name)
      if (!existsSync(join(dir, 'expected.md'))) continue
      const input = read(dir, 'input.md')
      const output = read(dir, 'expected.md')
      if (input.includes('\r\n')) {
        expect(output.replace(/\r\n/g, ''), name).not.toMatch(/\n/)
      } else {
        expect(output, name).not.toMatch(/\r/)
      }
    }
  })

  test('an edit that is a no-op by design returns the input exactly', async () => {
    for (const name of cases.filter((n) => /no-op|already/.test(n))) {
      const dir = join(root, name)
      expect(read(dir, 'expected.md'), name).toBe(read(dir, 'input.md'))
    }
  })

  test('changed region stays small', () => {
    for (const name of cases.filter((n) => /^(set|unset|append-to|remove-from)/.test(n))) {
      const dir = join(root, name)
      if (!existsSync(join(dir, 'expected.md'))) continue
      const { removed, added } = changedRegion(read(dir, 'input.md'), read(dir, 'expected.md'))
      expect(removed.length, `${name} removed`).toBeLessThanOrEqual(6)
      expect(added.length, `${name} added`).toBeLessThanOrEqual(6)
    }
  })
})

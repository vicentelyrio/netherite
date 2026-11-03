import { describe, expect, test } from 'vitest'
import { isHidden, snoozeUntil, step, tabOf, tagPair, todoTitle, weekAfter } from './triage'

const at = new Date(2026, 1, 15, 14, 0)

describe('triage', () => {
  test('commit-born items have their own tab', () => {
    expect(tabOf('closing-commit')).toBe('commits')
    expect(tabOf('new-todo')).toBe('commits')
    expect(tabOf('stale-doc')).toBe('review')
  })

  test('archived stays hidden; a snooze ends', () => {
    const hidden = {
      a: { kind: 'archive' },
      s: { kind: 'snooze', until: snoozeUntil(at) },
    } as const
    expect(isHidden(hidden, 'a', at.getTime())).toBe(true)
    expect(isHidden(hidden, 's', at.getTime())).toBe(true)
    expect(isHidden(hidden, 's', at.getTime() + 2 * 86_400_000)).toBe(false)
    expect(isHidden(hidden, 'x', at.getTime())).toBe(false)
  })

  test('snooze runs to nine the next morning', () => {
    const d = new Date(snoozeUntil(at))
    expect([d.getDate(), d.getHours()]).toEqual([16, 9])
  })

  test('reads the pair out of a similar-tag key', () => {
    const item = { key: 'similar-tag:labels:Back-End|backend' } as never
    expect(tagPair(item)).toEqual({ field: 'labels', keep: 'Back-End', merge: 'backend' })
    expect(tagPair({ key: 'orphan:X' } as never)).toBeUndefined()
  })

  test('moving the due date goes a week past the later of the old date and today', () => {
    expect(weekAfter('2026-02-01', at)).toBe('2026-02-22')
    expect(weekAfter('2026-03-01', at)).toBe('2026-03-08')
    expect(weekAfter(undefined, at)).toBe('2026-02-22')
  })

  test('J and K stay inside the list', () => {
    expect(step([], undefined, 1)).toBeUndefined()
    expect(step(['a', 'b'], undefined, 1)).toBe('a')
    expect(step(['a', 'b'], undefined, -1)).toBe('b')
    expect(step(['a', 'b'], 'b', 1)).toBe('b')
    expect(step(['a', 'b'], 'b', -1)).toBe('a')
  })

  test('a TODO line becomes a plain title', () => {
    expect(todoTitle('  // TODO: handle empty list')).toBe('handle empty list')
    expect(todoTitle('/* TODO(vicente) - cache this */')).toBe('cache this')
    expect(todoTitle('# todo retry')).toBe('retry')
  })
})

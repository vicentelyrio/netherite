import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { followServer, invalidationsFor } from '../src/lib/live'

describe('what each event makes stale', () => {
  test('item changes refresh lists, those items, and everything derived from items', () => {
    const keys = invalidationsFor({
      type: 'items',
      upserted: ['a.md'],
      removed: [],
      affected: ['a.md'],
      ids: ['TASK-00001', 'DOC-00002'],
    })
    expect(keys).toContainEqual(['items', 'list'])
    expect(keys).toContainEqual(['items', 'item', 'TASK-00001'])
    expect(keys).toContainEqual(['items', 'item', 'DOC-00002'])
    // The editor holds the whole file, which is stale too.
    expect(keys).toContainEqual(['items', 'source', 'TASK-00001'])
    for (const family of ['health', 'search', 'graph', 'inbox', 'history', 'stats']) {
      expect(
        keys.some((k) => k[0] === family),
        family,
      ).toBe(true)
    }
  })

  test('a git change refreshes what depends on commits and the working tree, not the items', () => {
    const keys = invalidationsFor({ type: 'git', changes: 1 })
    expect(keys.map((k) => k[0])).toEqual(expect.arrayContaining(['inbox', 'history', 'stats']))
    expect(keys.some((k) => k[0] === 'items')).toBe(false)
  })

  test('a lint change refreshes lint and the inbox', () => {
    expect(
      invalidationsFor({ type: 'lint', error: 1, warning: 0, info: 0 }).map((k) => k[0]),
    ).toEqual(['lint', 'inbox'])
  })

  test('a config change refreshes everything; ready, ping and config errors refresh nothing', () => {
    expect(invalidationsFor({ type: 'config', requiresRestart: false })).toEqual([[]])
    expect(invalidationsFor({ type: 'ready', version: '1' })).toEqual([])
    expect(invalidationsFor({ type: 'ping' })).toEqual([])
    expect(invalidationsFor({ type: 'config-invalid', message: 'x' })).toEqual([])
  })
})

/** An event stream the test drives by hand. */
class FakeSource {
  static last: FakeSource | undefined
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((m: { data: string }) => void) | null = null
  closed = false
  constructor(readonly url: string) {
    FakeSource.last = this
  }
  close() {
    this.closed = true
  }
  send(event: unknown) {
    this.onmessage?.({ data: typeof event === 'string' ? event : JSON.stringify(event) })
  }
}

describe('following the stream', () => {
  const original = globalThis.EventSource
  beforeEach(() => {
    globalThis.EventSource = FakeSource as never
  })
  afterEach(() => {
    globalThis.EventSource = original
    FakeSource.last = undefined
  })

  const setup = () => {
    const client = new QueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const states: string[] = []
    const notices: unknown[] = []
    const stop = followServer({
      baseUrl: 'http://127.0.0.1:1',
      client,
      onConnection: (s) => states.push(s),
      onNotice: (e) => notices.push(e),
    })
    return { source: FakeSource.last as FakeSource, invalidate, states, notices, stop }
  }

  test('connects to the events endpoint and reports its state', () => {
    const { source, states } = setup()
    expect(source.url).toBe('http://127.0.0.1:1/api/events')
    expect(states).toEqual(['connecting'])
    source.onopen?.()
    expect(states).toEqual(['connecting', 'live'])
  })

  test('refreshes the queries an event names', () => {
    const { source, invalidate } = setup()
    source.send({ type: 'items', upserted: [], removed: [], affected: [], ids: ['TASK-00001'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['items', 'item', 'TASK-00001'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['items', 'list'] })
  })

  test('ignores what it cannot read: bad JSON, unknown event types, wrong shapes', () => {
    const { source, invalidate, notices } = setup()
    source.send('not json')
    source.send({ type: 'from-the-future' })
    source.send({ type: 'items' })
    expect(invalidate).not.toHaveBeenCalled()
    expect(notices).toEqual([])
  })

  test('hands config events to the notice callback', () => {
    const { source, notices } = setup()
    source.send({ type: 'config-invalid', message: 'bad' })
    source.send({ type: 'config', requiresRestart: true })
    expect(notices).toEqual([
      { type: 'config-invalid', message: 'bad' },
      { type: 'config', requiresRestart: true },
    ])
  })

  test('after a break, reconnecting refreshes everything, since events were missed; a first connection does not', () => {
    const { source, invalidate, states } = setup()
    source.onopen?.()
    expect(invalidate).not.toHaveBeenCalled()
    source.onerror?.()
    expect(states.at(-1)).toBe('offline')
    source.onopen?.()
    expect(states.at(-1)).toBe('live')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith()
    source.onopen?.()
    expect(invalidate).toHaveBeenCalledTimes(1)
  })

  test('stops listening', () => {
    const { source, stop } = setup()
    stop()
    expect(source.closed).toBe(true)
  })
})

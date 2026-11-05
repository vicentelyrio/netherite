import { describe, expect, test } from 'vitest'
import { addCapture, readCaptures, removeCapture } from '../src/index'
import { world } from './ops-helpers'

const base = { '/repo/.netherite/config.yml': 'version: 1\n' }

describe('captures', () => {
  test('a missing file has no captures; adding creates it, newest at the bottom', async () => {
    const w = await world(base)
    expect(await w.run(readCaptures(w.repo))).toEqual([])
    await w.run(addCapture(w.repo, 'first idea'))
    await w.run(addCapture(w.repo, '  second\n idea  '))
    expect((await w.run(readCaptures(w.repo))).map((c) => c.text)).toEqual([
      'first idea',
      'second idea',
    ])
    expect(w.read('inbox.md')).toBe('- first idea\n- second idea\n')
  })

  test('reads plain lines and list items the same', async () => {
    const w = await world({ ...base, '/repo/inbox.md': 'plain line\n* star\n- dash\n\n' })
    expect((await w.run(readCaptures(w.repo))).map((c) => c.text)).toEqual([
      'plain line',
      'star',
      'dash',
    ])
  })

  test('an empty or very long line is refused', async () => {
    const w = await world(base)
    expect((await w.fail(addCapture(w.repo, '  '))).message).toMatch(/something/)
    expect((await w.fail(addCapture(w.repo, 'x'.repeat(501)))).message).toMatch(/500/)
  })

  test('removing takes one line out and says whether it was there', async () => {
    const w = await world({ ...base, '/repo/inbox.md': '- a\n- b\n- a\n' })
    expect(await w.run(removeCapture(w.repo, 'a'))).toBe(true)
    expect(w.read('inbox.md')).toBe('- b\n- a\n')
    expect(await w.run(removeCapture(w.repo, 'gone'))).toBe(false)
  })
})

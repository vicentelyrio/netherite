import { describe, expect, test } from 'vitest'
import { isDirty, reduce, startSession, type Version } from '@/components/ItemEditor/session'

const v = (text: string, hash = `h-${text}`): Version => ({ text, hash })

describe('an editing session', () => {
  test('starts clean, with the buffer equal to the file', () => {
    const s = startSession(v('one'))
    expect(s.buffer).toBe('one')
    expect(isDirty(s)).toBe(false)
    expect(s.conflict).toBeUndefined()
  })

  test('typing makes it dirty, and typing back makes it clean again', () => {
    let s = startSession(v('one'))
    s = reduce(s, { type: 'edit', text: 'one!' })
    expect(isDirty(s)).toBe(true)
    s = reduce(s, { type: 'edit', text: 'one' })
    expect(isDirty(s)).toBe(false)
  })

  describe('the file changes on disk', () => {
    test('with nothing typed, the buffer just follows, with no fuss', () => {
      const s = reduce(startSession(v('one')), { type: 'remote', version: v('two') })
      expect(s).toEqual({ base: v('two'), buffer: 'two', conflict: undefined })
    })

    test('with changes typed, nothing is lost or overwritten: the new version is held aside', () => {
      let s = startSession(v('one'))
      s = reduce(s, { type: 'edit', text: 'one mine' })
      s = reduce(s, { type: 'remote', version: v('two') })
      expect(s.buffer).toBe('one mine')
      expect(s.base).toEqual(v('one'))
      expect(s.conflict).toEqual(v('two'))
    })

    test('hearing about the version it already has changes nothing', () => {
      const s = startSession(v('one'))
      expect(reduce(s, { type: 'remote', version: v('one') })).toBe(s)
      const dirty = reduce(s, { type: 'edit', text: 'x' })
      expect(reduce(dirty, { type: 'remote', version: v('one') })).toBe(dirty)
    })

    test('the same newer version twice is one conflict', () => {
      let s = reduce(startSession(v('one')), { type: 'edit', text: 'mine' })
      s = reduce(s, { type: 'remote', version: v('two') })
      expect(reduce(s, { type: 'remote', version: v('two') })).toBe(s)
    })

    test('a newer version after a conflict replaces the one held', () => {
      let s = reduce(startSession(v('one')), { type: 'edit', text: 'mine' })
      s = reduce(s, { type: 'remote', version: v('two') })
      s = reduce(s, { type: 'remote', version: v('three') })
      expect(s.conflict).toEqual(v('three'))
    })

    test('if the file turns out to say what the buffer says, there is nothing to decide', () => {
      let s = reduce(startSession(v('one')), { type: 'edit', text: 'two' })
      s = reduce(s, { type: 'remote', version: v('two') })
      expect(s).toEqual({ base: v('two'), buffer: 'two', conflict: undefined })
      expect(isDirty(s)).toBe(false)
    })

    test('the same text under a new hash is not a change', () => {
      let s = reduce(startSession(v('one', 'a')), { type: 'edit', text: 'mine' })
      s = reduce(s, { type: 'remote', version: v('one', 'b') })
      expect(s.conflict).toBeUndefined()
      expect(s.base.hash).toBe('b')
      expect(s.buffer).toBe('mine')
    })

    test('if the file goes back to the version the buffer started from, the conflict goes away', () => {
      let s = reduce(startSession(v('one')), { type: 'edit', text: 'mine' })
      s = reduce(s, { type: 'remote', version: v('two') })
      s = reduce(s, { type: 'remote', version: v('one') })
      expect(s.conflict).toBeUndefined()
      expect(s.buffer).toBe('mine')
    })
  })

  describe('resolving', () => {
    const conflicted = () => {
      let s = reduce(startSession(v('one')), { type: 'edit', text: 'one mine' })
      s = reduce(s, { type: 'remote', version: v('two') })
      return s
    }

    test('reload drops the changes and takes the file as it is', () => {
      expect(reduce(conflicted(), { type: 'reload' })).toEqual({
        base: v('two'),
        buffer: 'two',
        conflict: undefined,
      })
    })

    test('keep mine keeps the buffer, and the next save goes over the newer version', () => {
      const s = reduce(conflicted(), { type: 'keep-mine' })
      expect(s.buffer).toBe('one mine')
      expect(s.base).toEqual(v('two'))
      expect(s.conflict).toBeUndefined()
      expect(isDirty(s)).toBe(true)
    })

    test('reload with no conflict resets the buffer to what was last saved', () => {
      const s = reduce(startSession(v('one')), { type: 'edit', text: 'junk' })
      expect(reduce(s, { type: 'reload' })).toEqual({
        base: v('one'),
        buffer: 'one',
        conflict: undefined,
      })
    })

    test('keep mine with no conflict does nothing', () => {
      const s = startSession(v('one'))
      expect(reduce(s, { type: 'keep-mine' })).toBe(s)
    })
  })

  test('a save makes the saved text the base, and keeps whatever was typed while it saved', () => {
    let s = reduce(startSession(v('one')), { type: 'edit', text: 'two' })
    s = reduce(s, { type: 'edit', text: 'two plus' })
    s = reduce(s, { type: 'saved', version: v('two') })
    expect(s.base).toEqual(v('two'))
    expect(s.buffer).toBe('two plus')
    expect(isDirty(s)).toBe(true)
  })

  test('saving clears a conflict', () => {
    let s = reduce(startSession(v('one')), { type: 'edit', text: 'mine' })
    s = reduce(s, { type: 'remote', version: v('two') })
    s = reduce(s, { type: 'saved', version: v('mine') })
    expect(s.conflict).toBeUndefined()
  })
})

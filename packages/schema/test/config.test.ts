import { Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import { Config, defaultConfig } from '../src/index'
import { fixtureConfig } from './helpers'

const decode = Schema.decodeUnknownSync(Config)

describe('Config', () => {
  test('only version is required; everything else has a default', () => {
    expect(defaultConfig).toEqual({
      version: 1,
      content: 'netherite',
      id_padding: 5,
      states: [
        { name: 'backlog', category: 'todo' },
        { name: 'doing', category: 'active' },
        { name: 'blocked', category: 'blocked' },
        { name: 'done', category: 'done' },
      ],
      freshness: { drifting: 1, stale: 10 },
      context: { budget: 8000, targets: ['claude', 'agents'] },
    })
  })

  test('the fixture config matches the defaults', () => {
    expect(fixtureConfig).toEqual(defaultConfig)
  })

  test('keeps explicit values and fills the rest', () => {
    const config = decode({ version: 1, content: 'docs', freshness: { stale: 3 } })
    expect(config.content).toBe('docs')
    expect(config.freshness).toEqual({ drifting: 1, stale: 3 })
    expect(config.id_padding).toBe(5)
  })

  test('keeps unknown keys', () => {
    expect(decode({ version: 1, experimental: true })).toHaveProperty('experimental', true)
  })

  test.each([
    ['missing version', {}],
    ['a future version', { version: 2 }],
    ['zero padding', { version: 1, id_padding: 0 }],
    ['no states', { version: 1, states: [] }],
    [
      'a state with an unknown category',
      { version: 1, states: [{ name: 'x', category: 'later' }] },
    ],
    ['an unknown context target', { version: 1, context: { targets: ['gemini'] } }],
    ['a negative budget', { version: 1, context: { budget: -1 } }],
  ])('rejects %s', (_name, input) => {
    expect(() => decode(input)).toThrow()
  })
})

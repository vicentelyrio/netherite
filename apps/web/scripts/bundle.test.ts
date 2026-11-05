import { describe, expect, test } from 'vitest'
import { compare, effectModulesOf, snapshot } from './bundle.mjs'

const id = (path: string) => `/x/node_modules/.pnpm/effect@4.1.1/node_modules/effect/dist/${path}`
const report = {
  chunks: [
    {
      file: 'a.js',
      modules: { [id('Schema.js')]: 100, [`${id('Schema.js')}?x`]: 1, '/x/src/main.ts': 50 },
    },
    { file: 'b.js', modules: { [id('http/HttpClient.js')]: 40 } },
  ],
}

describe('the browser bundle check', () => {
  test('finds the modules of effect, wherever they were put', () => {
    expect(effectModulesOf(report)).toEqual({ 'Schema.js': 101, 'http/HttpClient.js': 40 })
  })

  const record = snapshot({ 'Schema.js': 100, 'http/HttpClient.js': 40 }, 1000)

  test('passes the same build, and a small growth', () => {
    expect(compare(record, record)).toEqual([])
    expect(compare(snapshot({ 'Schema.js': 100, 'http/HttpClient.js': 44 }, 1040), record)).toEqual(
      [],
    )
  })

  test('fails when a module of effect that the record does not have shows up', () => {
    const more = snapshot({ 'Schema.js': 100, 'http/HttpClient.js': 40, 'Stream.js': 3 }, 1000)
    const [problem] = compare(more, record)
    expect(problem).toContain('Stream.js')
  })

  test('fails when effect or the scripts grow past the margin', () => {
    expect(
      compare(snapshot({ 'Schema.js': 200, 'http/HttpClient.js': 40 }, 1000), record)[0],
    ).toContain('effect grew')
    expect(
      compare(snapshot({ 'Schema.js': 100, 'http/HttpClient.js': 40 }, 1200), record)[0],
    ).toContain('gzipped')
  })
})

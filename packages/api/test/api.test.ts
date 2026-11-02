import type { Schema } from 'effect'
import { OpenApi } from 'effect/http-api'
import { describe, expect, test } from 'vitest'
import {
  Conflict,
  Failure,
  Invalid,
  NetheriteApi,
  NotFound,
  Refused,
  relationKinds,
  Unavailable,
} from '../src/index'

const doc = OpenApi.fromApi(NetheriteApi) as unknown as {
  paths: Record<string, Record<string, { operationId: string; responses: Record<string, unknown> }>>
}
const operation = (method: string, path: string) => doc.paths[path]?.[method]

describe('the API definition', () => {
  test('has the groups and paths the app needs, all under /api', () => {
    expect(Object.keys(NetheriteApi.groups).sort()).toEqual([
      'events',
      'goals',
      'graph',
      'history',
      'inbox',
      'items',
      'lint',
      'lintText',
      'meta',
      'search',
      'stats',
    ])
    expect(Object.keys(doc.paths).every((p) => p.startsWith('/api/'))).toBe(true)
    expect(Object.keys(doc.paths).sort()).toEqual(
      [
        '/api/events',
        '/api/goals',
        '/api/goals/{id}',
        '/api/graph',
        '/api/health',
        '/api/history/decisions',
        '/api/history/items/{id}',
        '/api/inbox',
        '/api/items',
        '/api/items/{id}',
        '/api/items/{id}/checks',
        '/api/items/{id}/links',
        '/api/items/{id}/review',
        '/api/items/{id}/source',
        '/api/lint/text',
        '/api/items/{id}/state',
        '/api/lint',
        '/api/schemas/{type}',
        '/api/search',
        '/api/stats',
      ].sort(),
    )
  })

  test('tagged errors carry the statuses from ADR-00010', () => {
    const status = (error: Schema.Top) =>
      (error.ast.annotations as Record<string, unknown>).httpApiStatus
    expect(status(Invalid)).toBe(422)
    expect(status(Conflict)).toBe(409)
    expect(status(Refused)).toBe(409)
    expect(status(NotFound)).toBe(404)
    expect(status(Unavailable)).toBe(503)
    expect(status(Failure)).toBe(500)
  })

  test('every write documents the failures it can have', () => {
    const writes = [
      ['post', '/api/items'],
      ['patch', '/api/items/{id}'],
      ['put', '/api/items/{id}/state'],
      ['put', '/api/items/{id}/source'],
      ['post', '/api/items/{id}/checks'],
      ['post', '/api/items/{id}/links'],
      ['delete', '/api/items/{id}/links'],
      ['post', '/api/items/{id}/review'],
      ['delete', '/api/items/{id}'],
    ] as const
    for (const [method, path] of writes) {
      const codes = Object.keys(operation(method, path)?.responses ?? {})
      for (const code of ['422', '409', '404']) {
        expect(codes, `${method.toUpperCase()} ${path}`).toContain(code)
      }
    }
    expect(Object.keys(operation('post', '/api/items')?.responses ?? {})).toContain('201')
  })

  test('relations a client may write are the ones the model defines', () => {
    expect(relationKinds).toEqual([
      'belongs_to',
      'implements',
      'explains',
      'supersedes',
      'depends_on',
      'related',
    ])
  })
})

import { readFileSync } from 'node:fs'
import { request } from 'node:http'
import { createConnection } from 'node:net'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { NodeServices } from '@effect/platform-node'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { check, isLoopbackHost, listen, NotLoopback, type Policy } from '../src/index'
import { isolateGit, makeTempState, type Running, withServer } from './helpers'

beforeAll(isolateGit)

interface Reply {
  readonly status: number
  readonly headers: Record<string, string | string[] | undefined>
  readonly text: string
}

/** A request with exactly the headers given, including `Host` and `Origin`, which `fetch` may rewrite. */
const send = (
  s: Running,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<Reply> =>
  new Promise((resolve, reject) => {
    const url = new URL(s.url)
    const payload = body === undefined ? undefined : JSON.stringify(body)
    const req = request(
      {
        host: url.hostname,
        port: url.port,
        method,
        path,
        headers: {
          host: `127.0.0.1:${url.port}`,
          ...(payload === undefined ? {} : { 'content-type': 'application/json' }),
          ...headers,
        },
      },
      (res) => {
        let text = ''
        res.on('data', (chunk) => {
          text += chunk
        })
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, text }))
      },
    )
    req.on('error', reject)
    if (payload !== undefined) req.write(payload)
    req.end()
  })

const port = (s: Running) => new URL(s.url).port
const task1 = 'netherite/tasks/TASK-00001-core.md'
const patch = { set: { labels: ['hacked'] } }

describe('Host header (DNS rebinding)', () => {
  test('a request addressed to another name is refused, even a read', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        for (const host of [
          `evil.example:${port(s)}`,
          'evil.example',
          `127.0.0.1.evil.example:${port(s)}`,
          `localhost.evil.example:${port(s)}`,
          `127.0.0.1:${Number(port(s)) + 1}`,
        ]) {
          const reply = await send(s, 'GET', '/api/health', { host })
          expect(reply.status, `Host: ${host}`).toBe(403)
          expect(JSON.parse(reply.text)._tag).toBe('Forbidden')
        }
      }),
    )
  })

  test('the loopback names are accepted', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        for (const host of [
          `127.0.0.1:${port(s)}`,
          `localhost:${port(s)}`,
          `LOCALHOST:${port(s)}`,
          `[::1]:${port(s)}`,
        ]) {
          expect((await send(s, 'GET', '/api/health', { host })).status, host).toBe(200)
        }
      }),
    )
  })

  test('a rebound request with the real token is still refused, and changes nothing', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const before = readFileSync(join(s.dir, task1), 'utf8')
        const reply = await send(
          s,
          'PATCH',
          '/api/items/TASK-00001',
          { host: `evil.example:${port(s)}`, 'x-netherite-token': s.token },
          patch,
        )
        expect(reply.status).toBe(403)
        expect(readFileSync(join(s.dir, task1), 'utf8')).toBe(before)
      }),
    )
  })

  test('the event stream is protected too', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        expect((await send(s, 'GET', '/api/events', { host: 'evil.example' })).status).toBe(403)
      }),
    )
  })
})

describe('Origin header (cross-origin pages)', () => {
  test('another origin is refused for reads and writes', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const before = readFileSync(join(s.dir, task1), 'utf8')
        for (const origin of [
          'https://evil.example',
          'http://evil.example',
          'null',
          `http://127.0.0.1:${Number(port(s)) + 1}`,
          `https://127.0.0.1:${port(s)}`,
          `http://127.0.0.1.evil.example:${port(s)}`,
        ]) {
          expect(
            (await send(s, 'GET', '/api/items', { origin })).status,
            `GET from ${origin}`,
          ).toBe(403)
          const write = await send(
            s,
            'PATCH',
            '/api/items/TASK-00001',
            { origin, 'x-netherite-token': s.token },
            patch,
          )
          expect(write.status, `PATCH from ${origin}`).toBe(403)
        }
        expect(readFileSync(join(s.dir, task1), 'utf8')).toBe(before)
      }),
    )
  })

  test('the server’s own origin is accepted', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        for (const origin of [s.url, `http://localhost:${port(s)}`]) {
          expect((await send(s, 'GET', '/api/items', { origin })).status, origin).toBe(200)
        }
      }),
    )
  })

  test('a cross-origin preflight is refused, and no response grants cross-origin access', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const preflight = await send(s, 'OPTIONS', '/api/items/TASK-00001', {
          origin: 'https://evil.example',
          'access-control-request-method': 'PATCH',
          'access-control-request-headers': 'x-netherite-token',
        })
        expect(preflight.status).toBe(403)
        for (const reply of [
          preflight,
          await send(s, 'GET', '/api/items', { origin: s.url }),
          await send(s, 'GET', '/api/health'),
        ]) {
          expect(Object.keys(reply.headers).filter((h) => h.startsWith('access-control-'))).toEqual(
            [],
          )
        }
      }),
    )
  })

  test('Sec-Fetch-Site: cross-site is refused even without an Origin', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        expect(
          (await send(s, 'GET', '/api/items', { 'sec-fetch-site': 'cross-site' })).status,
        ).toBe(403)
        for (const site of ['same-origin', 'same-site', 'none']) {
          expect(
            (await send(s, 'GET', '/api/items', { 'sec-fetch-site': site })).status,
            site,
          ).toBe(200)
        }
      }),
    )
  })

  test('origins listed for development are accepted, and still need the token to write', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          const dev = 'http://localhost:5173'
          expect((await send(s, 'GET', '/api/items', { origin: dev })).status).toBe(200)
          expect(
            (await send(s, 'GET', '/api/items', { origin: dev, 'sec-fetch-site': 'same-site' }))
              .status,
          ).toBe(200)
          expect(
            (await send(s, 'PATCH', '/api/items/TASK-00001', { origin: dev }, patch)).status,
          ).toBe(401)
          expect(
            (
              await send(
                s,
                'PATCH',
                '/api/items/TASK-00001',
                { origin: dev, 'x-netherite-token': s.token },
                patch,
              )
            ).status,
          ).toBe(200)
          expect(
            (await send(s, 'GET', '/api/items', { origin: 'http://localhost:5174' })).status,
          ).toBe(403)
        }),
      { origins: ['http://localhost:5173'] },
    )
  })
})

describe('the session token', () => {
  const writes: Array<[string, string, unknown]> = [
    ['POST', '/api/items', { type: 'doc', title: 'x' }],
    ['PATCH', '/api/items/TASK-00001', patch],
    ['PUT', '/api/items/TASK-00001/state', { state: 'doing' }],
    ['POST', '/api/items/TASK-00001/checks', { item: 0 }],
    ['POST', '/api/items/TASK-00002/links', { to: 'TASK-00001', kind: 'related' }],
    ['DELETE', '/api/items/TASK-00002/links?to=TASK-00001&kind=depends_on', undefined],
    ['POST', '/api/items/DOC-00001/review', {}],
    ['DELETE', '/api/items/TASK-00002', undefined],
  ]

  test('every write is refused without it, and nothing on disk changes', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const files = () =>
          ['TASK-00001-core', 'TASK-00002-cli'].map((f) =>
            readFileSync(join(s.dir, `netherite/tasks/${f}.md`), 'utf8'),
          )
        const before = files()
        for (const [method, path, body] of writes) {
          const missing = await send(s, method, path, {}, body)
          expect(missing.status, `${method} ${path}`).toBe(401)
          expect(JSON.parse(missing.text)._tag).toBe('Unauthorized')
          const wrong = await send(s, method, path, { 'x-netherite-token': 'nope' }, body)
          expect(wrong.status, `${method} ${path} with a wrong token`).toBe(401)
          const nearly = await send(
            s,
            method,
            path,
            { 'x-netherite-token': s.token.slice(0, -1) },
            body,
          )
          expect(nearly.status).toBe(401)
        }
        expect(files()).toEqual(before)
        expect((await send(s, 'GET', '/api/items')).status).toBe(200)
      }),
    )
  })

  test('the token is accepted as x-netherite-token or as a Bearer token', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const a = await send(
          s,
          'PATCH',
          '/api/items/TASK-00001',
          { 'x-netherite-token': s.token },
          patch,
        )
        const b = await send(
          s,
          'PATCH',
          '/api/items/TASK-00001',
          { authorization: `Bearer ${s.token}` },
          { set: { labels: ['b'] } },
        )
        expect([a.status, b.status]).toEqual([200, 200])
      }),
    )
  })

  test('reads need no token', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        for (const path of [
          '/api/health',
          '/api/items',
          '/api/graph',
          '/api/lint',
          '/api/inbox',
          '/api/search?q=core',
        ]) {
          expect((await send(s, 'GET', path)).status, path).toBe(200)
        }
      }),
    )
  })

  test('the typed client sends it, so the app’s writes work', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const made = yield* s.client.items.create({ payload: { type: 'doc', title: 'With token' } })
        expect(made.id).toBe('DOC-00002')
      }),
    )
  })

  test('it is long, random per session, and never in a response', async () => {
    expect(await withServer((s) => Effect.succeed(s.token))).toMatch(/^[0-9a-f]{64}$/)
    const a = await withServer((s) => Effect.succeed(s.token))
    const b = await withServer((s) => Effect.succeed(s.token))
    expect(a).not.toBe(b)
    await withServer((s) =>
      Effect.promise(async () => {
        for (const path of [
          '/api/health',
          '/api/items',
          '/api/openapi.json',
          '/api/inbox',
          '/api/schemas/task',
        ]) {
          expect((await send(s, 'GET', path)).text, path).not.toContain(s.token)
        }
        const refused = await send(
          s,
          'PATCH',
          '/api/items/TASK-00001',
          { 'x-netherite-token': 'nope' },
          patch,
        )
        expect(refused.text).not.toContain(s.token)
      }),
    )
  })
})

describe('listening', () => {
  test('only loopback addresses are accepted', async () => {
    for (const host of ['0.0.0.0', '::', '192.168.1.20', 'example.com', '10.0.0.1', '']) {
      const state = await makeTempState()
      const error = await Effect.runPromise(
        Effect.flip(Effect.scoped(listen(state, { host, port: 0 }))).pipe(
          Effect.provide(NodeServices.layer),
        ),
      )
      expect(error, host).toBeInstanceOf(NotLoopback)
      expect((error as Error).message).toContain('loopback')
    }
    expect(['127.0.0.1', '127.1.2.3', 'localhost', '::1', '[::1]'].every(isLoopbackHost)).toBe(true)
    expect(
      ['0.0.0.0', '::', '192.168.1.20', '1270.0.0.1', '127.0.0.1.evil.example'].some(
        isLoopbackHost,
      ),
    ).toBe(false)
  })

  test('the socket is on 127.0.0.1: other addresses of this machine cannot connect', async () => {
    const external = Object.values(networkInterfaces())
      .flat()
      .find((i) => i && i.family === 'IPv4' && !i.internal)
    if (external === undefined) return // no network interface to try
    await withServer((s) =>
      Effect.promise(
        () =>
          new Promise<void>((resolve, reject) => {
            const socket = createConnection({ host: external.address, port: Number(port(s)) })
            socket.on('connect', () => {
              socket.destroy()
              reject(new Error(`connected through ${external.address}`))
            })
            socket.on('error', (error) => {
              expect((error as NodeJS.ErrnoException).code).toBe('ECONNREFUSED')
              resolve()
            })
          }),
      ),
    )
  })
})

describe('the check itself', () => {
  const policy: Policy = { token: 'secret', port: () => 4747, origins: [] }
  const get = (headers: Record<string, string>) => check({ method: 'GET', headers }, policy)

  test('needs a Host', () => {
    expect(get({}).ok).toBe(false)
    expect(get({ host: '127.0.0.1:4747' }).ok).toBe(true)
  })

  test('follows the port the server really got', () => {
    let current = 1
    const live: Policy = { ...policy, port: () => current }
    expect(check({ method: 'GET', headers: { host: '127.0.0.1:4748' } }, live).ok).toBe(false)
    current = 4748
    expect(check({ method: 'GET', headers: { host: '127.0.0.1:4748' } }, live).ok).toBe(true)
  })

  test('a refusal says why without giving the token away', () => {
    const verdict = check({ method: 'POST', headers: { host: '127.0.0.1:4747' } }, policy)
    expect(verdict).toMatchObject({ ok: false, status: 401 })
    expect(JSON.stringify(verdict)).not.toContain('secret')
  })
})

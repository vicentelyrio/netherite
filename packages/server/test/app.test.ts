import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { NodeServices } from '@effect/platform-node'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { listen, withSession } from '../src/index'
import { isolateGit, makeTempState, type Running, withServer } from './helpers'

beforeAll(isolateGit)

const get = async (s: Running, path: string, headers: Record<string, string> = {}) => {
  const response = await fetch(`${s.url}${path}`, { headers, redirect: 'manual' })
  return { status: response.status, headers: response.headers, text: await response.text() }
}

const app = (dir: string) => {
  const root = join(dir, 'dist')
  mkdirSync(join(root, 'assets'), { recursive: true })
  writeFileSync(
    join(root, 'index.html'),
    '<!doctype html><html><head><title>App</title></head><body><div id="root"></div></body></html>',
  )
  writeFileSync(join(root, 'assets/app-abc123.js'), 'console.log("app")')
  writeFileSync(join(root, 'assets/app-abc123.css'), 'body{margin:0}')
  writeFileSync(join(root, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
  writeFileSync(join(dir, 'secret.txt'), 'outside the app')
  symlinkSync(join(dir, 'secret.txt'), join(root, 'leak.txt'))
  return root
}

describe('the app', () => {
  test('without a built app, a placeholder page says so and still carries the session', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const page = await get(s, '/')
        expect(page.status).toBe(200)
        expect(page.headers.get('content-type')).toContain('text/html')
        expect(page.text).toContain('Netherite is running')
        expect(page.text).toContain(`<meta name="netherite-token" content="${s.token}">`)
        expect(page.text).toContain('<meta name="netherite-version" content="9.9.9">')
      }),
    )
  })

  test('serves index.html with the token injected into the head', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          const page = await get(s, '/')
          expect(page.text).toMatch(
            /<meta name="netherite-token" content="[0-9a-f]{64}"><meta name="netherite-version"[^>]*><meta name="netherite-workspace"[^>]*><\/head>/,
          )
          expect(page.text).toContain('<div id="root">')
        }),
      { appRoot: app },
    )
  })

  test('serves assets with their types and long caching, and the page without caching', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          const js = await get(s, '/assets/app-abc123.js')
          expect(js.text).toBe('console.log("app")')
          expect(js.headers.get('content-type')).toContain('text/javascript')
          expect(js.headers.get('cache-control')).toContain('immutable')
          expect((await get(s, '/assets/app-abc123.css')).headers.get('content-type')).toContain(
            'text/css',
          )
          expect((await get(s, '/favicon.svg')).headers.get('content-type')).toBe('image/svg+xml')
          const index = await get(s, '/')
          expect(index.headers.get('cache-control')).toBe('no-store')
        }),
      { appRoot: app },
    )
  })

  test('pages are sent with headers that stop framing and outside scripts', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          const page = await get(s, '/')
          const csp = page.headers.get('content-security-policy') ?? ''
          expect(csp).toContain("default-src 'self'")
          expect(csp).toContain("frame-ancestors 'none'")
          expect(csp).toContain("connect-src 'self'")
          expect(page.headers.get('x-content-type-options')).toBe('nosniff')
          expect(page.headers.get('referrer-policy')).toBe('no-referrer')
        }),
      { appRoot: app },
    )
  })

  test('a path without an extension is a client-side route and gets the app', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          for (const path of ['/projects/PRJ-00001', '/graph', '/tasks/TASK-00001?drawer=open']) {
            const page = await get(s, path)
            expect(page.status, path).toBe(200)
            expect(page.text, path).toContain('<div id="root">')
          }
        }),
      { appRoot: app },
    )
  })

  test('a missing file is a 404, not the app', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          expect((await get(s, '/assets/missing.js')).status).toBe(404)
          expect((await get(s, '/nope.png')).status).toBe(404)
        }),
      { appRoot: app },
    )
  })

  test('unknown API paths are JSON 404s, never the app', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          const reply = await get(s, '/api/nope')
          expect(reply.status).toBe(404)
          expect(JSON.parse(reply.text)._tag).toBe('NotFound')
          expect((await get(s, '/api')).status).toBe(404)
        }),
      { appRoot: app },
    )
  })

  test('cannot read outside the app folder: dot-dot, encoded dot-dot, backslashes, a symlink', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          for (const path of [
            '/../secret.txt',
            '/%2e%2e/secret.txt',
            '/assets/../../secret.txt',
            '/..%2fsecret.txt',
            '/%5c..%5csecret.txt',
            '/leak.txt',
          ]) {
            const reply = await get(s, path)
            expect(reply.text, path).not.toContain('outside the app')
            expect([400, 404], path).toContain(reply.status)
          }
          const net = await import('node:net')
          const raw = await new Promise<string>((resolve) => {
            const socket = net.createConnection(
              { host: '127.0.0.1', port: Number(new URL(s.url).port) },
              () => {
                socket.write(
                  `GET /../secret.txt HTTP/1.1\r\nHost: 127.0.0.1:${new URL(s.url).port}\r\nConnection: close\r\n\r\n`,
                )
              },
            )
            let data = ''
            socket.on('data', (d) => {
              data += d
            })
            socket.on('close', () => resolve(data))
          })
          expect(raw).not.toContain('outside the app')
        }),
      { appRoot: app },
    )
  })

  test('a token with HTML in it cannot break out of the meta tag', () => {
    const html = withSession('<html><head></head><body></body></html>', {
      token: '"><script>alert(1)</script>',
      version: '1',
      repo: { workspace: { root: '/repo' } },
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&quot;&gt;')
  })

  test('names the workspace, and a path with HTML in it cannot break out of the meta tag', () => {
    const session = { token: 't', version: '1' }
    const html = (root: string) =>
      withSession('<html><head></head></html>', { ...session, repo: { workspace: { root } } })
    expect(html('/repo')).toContain('<meta name="netherite-workspace" content="/repo">')
    expect(html('/"><script>alert(1)</script>')).not.toContain('<script>')
  })

  test('is behind the same Host and Origin checks as the API', async () => {
    await withServer(
      (s) =>
        Effect.promise(async () => {
          const { request } = await import('node:http')
          const status = await new Promise<number>((resolve) => {
            const url = new URL(s.url)
            request(
              { host: url.hostname, port: url.port, path: '/', headers: { host: 'evil.example' } },
              (res) => {
                res.resume()
                resolve(res.statusCode ?? 0)
              },
            ).end()
          })
          expect(status).toBe(403)
        }),
      { appRoot: app },
    )
  })
})

describe('choosing a port', () => {
  const occupy = (port: number) =>
    new Promise<() => Promise<void>>((resolve, reject) => {
      const server = createServer()
      server.once('error', reject)
      server.listen(port, '127.0.0.1', () =>
        resolve(() => new Promise((done) => server.close(() => done()))),
      )
    })
  const freePort = async () => {
    const release = await new Promise<{ port: number; close: () => void }>((resolve) => {
      const server = createServer()
      server.listen(0, '127.0.0.1', () =>
        resolve({ port: (server.address() as { port: number }).port, close: () => server.close() }),
      )
    })
    release.close()
    return release.port
  }

  const start = async (port: number, fallback: boolean) => {
    const state = await makeTempState()
    return Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const running = yield* listen(state, { port, fallback })
          return running.port
        }),
      ).pipe(Effect.provide(NodeServices.layer)),
    )
  }

  test('uses the port asked for when it is free', async () => {
    const port = await freePort()
    expect(await start(port, true)).toBe(port)
  })

  test('with fallback, takes the next free port when the first is busy', async () => {
    const port = await freePort()
    const free = [await occupy(port)]
    try {
      try {
        free.push(await occupy(port + 1))
      } catch {
        return
      }
      const got = await start(port, true)
      expect(got).toBeGreaterThanOrEqual(port + 2)
      expect(got).toBeLessThan(port + 50)
    } finally {
      await Promise.all(free.map((close) => close()))
    }
  })

  test('without fallback, a busy port fails instead of moving', async () => {
    const port = await freePort()
    const release = await occupy(port)
    try {
      await expect(start(port, false)).rejects.toBeDefined()
    } finally {
      await release()
    }
  })
})

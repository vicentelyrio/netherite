import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { beforeAll, describe, expect, test } from 'vitest'
import { cli, git, isolateGit, type Serving, serving } from './helpers'

beforeAll(isolateGit)

const temp = async <A>(use: (dir: string) => Promise<A>) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-serve-')))
  try {
    git(dir, 'init', '-q', '-b', 'main')
    await cli(dir, 'init')
    await cli(dir, 'new', 'goal', 'Ship it', '--created-by', '@ada')
    await cli(dir, 'new', 'project', 'App', '--set', 'goals=[GOAL-00001]', '--created-by', '@ada')
    await cli(dir, 'new', 'task', 'Core', '--set', 'project=PRJ-00001', '--created-by', '@ada')
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const withServe = async <A>(dir: string, args: string[], use: (s: Serving) => Promise<A>) => {
  const s = await serving(dir, ...args)
  try {
    return await use(s)
  } finally {
    await s.stop()
  }
}

const api = async (s: Serving, path: string, init: RequestInit = {}) => {
  const response = await fetch(`${s.url}${path}`, init)
  const text = await response.text()
  return { status: response.status, text, json: () => JSON.parse(text) }
}

describe('netherite serve', () => {
  test('starts on the port given, says where it is and how to connect an agent, and opens the browser', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0'], async (s) => {
        expect(s.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
        expect(s.token).toMatch(/^[0-9a-f]{64}$/)
        const text = s.stdout.join('\n')
        expect(text).toContain(`claude mcp add --transport http netherite ${s.url}/mcp`)
        expect(text).toContain('netherite mcp')
        expect(s.opened).toEqual([s.url])
        expect((await api(s, '/api/health')).json()).toMatchObject({ name: 'netherite', items: 3 })
      }),
    )
  })

  test('--no-open leaves the browser alone', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        expect(s.opened).toEqual([])
      }),
    )
  })

  test('with no command, serves too', async () => {
    await temp((dir) =>
      withServe(dir, ['--port', '0', '--no-open'], async (s) => {
        expect((await api(s, '/api/health')).status).toBe(200)
      }),
    )
  })

  test('stops on Ctrl-C with exit code 0', async () => {
    await temp(async (dir) => {
      const s = await serving(dir, 'serve', '--port', '0', '--no-open')
      expect(await s.stop()).toBe(0)
      expect(s.stdout.at(-1)).toBe('Stopped.')
      await expect(fetch(`${s.url}/api/health`)).rejects.toBeDefined()
    })
  })

  test('serves the page with this session’s token, and the API accepts it', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        const page = await api(s, '/')
        expect(page.text).toContain(`<meta name="netherite-token" content="${s.token}">`)
        const write = await api(s, '/api/items/TASK-00001/state', {
          method: 'PUT',
          headers: { 'content-type': 'application/json', 'x-netherite-token': s.token },
          body: JSON.stringify({ state: 'doing' }),
        })
        expect(write.status).toBe(200)
        expect(readFileSync(join(dir, 'netherite/tasks/TASK-00001-core.md'), 'utf8')).toContain(
          'state: doing',
        )
        const noToken = await api(s, '/api/items/TASK-00001/state', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ state: 'done' }),
        })
        expect(noToken.status).toBe(401)
      }),
    )
  })

  test('serves a built app from --app', async () => {
    await temp((dir) => {
      const app = join(dir, 'my-app')
      mkdirSync(app)
      writeFileSync(join(app, 'index.html'), '<html><head></head><body>my app</body></html>')
      return withServe(dir, ['serve', '--port', '0', '--no-open', '--app', app], async (s) => {
        expect((await api(s, '/')).text).toContain('my app')
        expect((await api(s, '/tasks/TASK-00001')).text).toContain('my app')
      })
    })
  })

  test('a port that is taken fails with exit 2 and says so', async () => {
    await temp(async (dir) => {
      await withServe(dir, ['serve', '--port', '0', '--no-open'], async (first) => {
        const port = new URL(first.url).port
        const result = await cli(dir, 'serve', '--port', port, '--no-open')
        expect(result.code).toBe(2)
        expect(result.stderr.join('\n')).toContain(`Port ${port} is already in use`)
      })
    })
  })

  test('outside a workspace, exit 2', async () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-none-')))
    try {
      const result = await cli(dir, 'serve', '--port', '0', '--no-open')
      expect(result.code).toBe(2)
      expect(result.stderr.join('\n')).toContain('netherite init')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('only answers to its own address', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        const { request } = await import('node:http')
        const url = new URL(s.url)
        const status = await new Promise<number>((resolve) => {
          request(
            {
              host: url.hostname,
              port: url.port,
              path: '/api/health',
              headers: { host: 'evil.example' },
            },
            (res) => {
              res.resume()
              resolve(res.statusCode ?? 0)
            },
          ).end()
        })
        expect(status).toBe(403)
      }),
    )
  })
})

describe('MCP over HTTP at /mcp', () => {
  const connect = async (s: Serving, token: string | null = s.token) => {
    const client = new Client({ name: 'test', version: '1.0.0' })
    const transport = new StreamableHTTPClientTransport(new URL(`${s.url}/mcp`), {
      requestInit: { headers: token === null ? {} : { Authorization: `Bearer ${token}` } },
    })
    await client.connect(transport)
    return client
  }

  test('an agent with the token can list the tools and write, and the file changes', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        const client = await connect(s)
        const tools = await client.listTools()
        expect(tools.tools.map((t) => t.name)).toContain('create')
        const made = (await client.callTool({
          name: 'create',
          arguments: { type: 'doc', title: 'From an agent' },
        })) as { isError?: boolean; content: Array<{ text: string }> }
        expect(made.isError).not.toBe(true)
        const { path } = JSON.parse(made.content[0]?.text ?? '{}')
        expect(existsSync(join(dir, path))).toBe(true)
        // The browser side sees it too.
        const listed = (await api(s, '/api/items?type=doc')).json()
        expect(listed.items.map((i: { title: string }) => i.title)).toContain('From an agent')
        await client.close()
      }),
    )
  })

  test('an agent’s write reaches browsers as an event', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        const events = await fetch(`${s.url}/api/events`)
        const reader = (events.body as ReadableStream<Uint8Array>).getReader()
        const decoder = new TextDecoder()
        let seen = ''
        const read = async (until: string) => {
          const start = Date.now()
          while (!seen.includes(until) && Date.now() - start < 5000) {
            const chunk = await reader.read()
            if (chunk.done) break
            seen += decoder.decode(chunk.value)
          }
        }
        await read('"type":"ready"')

        const client = await connect(s)
        await client.callTool({ name: 'create', arguments: { type: 'doc', title: 'Announced' } })
        await read('"type":"items"')
        expect(seen).toContain('"type":"items"')
        expect(seen).toContain('DOC-00001')
        await reader.cancel()
        await client.close()
      }),
    )
  })

  test('the agent’s write is in the activity log', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        const client = await connect(s)
        await client.callTool({ name: 'create', arguments: { type: 'doc', title: 'Logged' } })
        await client.close()
        expect(readFileSync(join(dir, '.netherite/local/activity.jsonl'), 'utf8')).toContain(
          '"tool":"create"',
        )
      }),
    )
  })

  test('without the token, or with a wrong one, the connection is refused', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        await expect(connect(s, null)).rejects.toBeDefined()
        await expect(connect(s, 'a'.repeat(64))).rejects.toBeDefined()
        const raw = await api(s, '/mcp', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
        })
        expect(raw.status).toBe(401)
      }),
    )
  })

  test('a session that does not exist is a 404, and no session at all is a 400', async () => {
    await temp((dir) =>
      withServe(dir, ['serve', '--port', '0', '--no-open'], async (s) => {
        const unknown = await api(s, '/mcp', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
            'mcp-session-id': 'nope',
            authorization: `Bearer ${s.token}`,
          },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
        })
        expect(unknown.status).toBe(404)
        expect((await api(s, '/mcp')).status).toBe(400)
      }),
    )
  })
})

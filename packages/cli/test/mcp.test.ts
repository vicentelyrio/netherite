import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { beforeAll, describe, expect, test } from 'vitest'
import { cli, isolateGit } from './helpers'

beforeAll(isolateGit)

const bin = join(__dirname, '..', 'dist', 'bin.mjs')
const built = existsSync(bin)

const temp = async <A>(use: (dir: string) => Promise<A>) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-cli-mcp-')))
  try {
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const connect = async (dir: string, ...extra: string[]) => {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [bin, 'mcp', '--dir', dir, ...extra],
    stderr: 'pipe',
    env: { ...(process.env as Record<string, string>) },
  })
  const stderr: string[] = []
  transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)))
  const client = new Client({ name: 'test', version: '1.0.0' })
  const errors: Error[] = []
  client.onerror = (error) => errors.push(error)
  await client.connect(transport)
  return { client, stderr, errors, transport }
}

describe.skipIf(!built)('netherite mcp (the built program)', () => {
  test('speaks MCP over stdio and edits the workspace', async () => {
    await temp(async (dir) => {
      execFileSync('git', ['init', '-q'], { cwd: dir })
      await cli(dir, 'init')
      const { client, stderr, errors } = await connect(dir)
      try {
        expect(client.getServerVersion()).toMatchObject({ name: 'netherite' })
        const { tools } = await client.listTools()
        expect(tools.map((t) => t.name)).toContain('create')

        const goal = (await client.callTool({
          name: 'create',
          arguments: { type: 'goal', title: 'Ship it' },
        })) as { content: Array<{ text: string }>; isError?: boolean }
        expect(goal.isError).toBeUndefined()
        const created = JSON.parse(goal.content[0]?.text ?? '{}')
        expect(created.id).toBe('GOAL-00001')
        expect(readFileSync(join(dir, created.path), 'utf8')).toContain('title: Ship it')

        const bad = (await client.callTool({
          name: 'create',
          arguments: { type: 'task', title: 'x', fields: { project: 'PRJ-00404' } },
        })) as { content: Array<{ text: string }>; isError?: boolean }
        expect(bad.isError).toBe(true)
        expect(JSON.parse(bad.content[0]?.text ?? '{}').error.issues[0].field).toBe('project')

        // The write is in the activity log, and git does not see the log.
        const logged = readFileSync(join(dir, '.netherite/local/activity.jsonl'), 'utf8')
          .trim()
          .split('\n')
        expect(logged).toHaveLength(1)
        expect(JSON.parse(logged[0] ?? '{}')).toMatchObject({
          tool: 'create',
          id: 'GOAL-00001',
          actor: 'mcp',
        })
        expect(
          execFileSync('git', ['check-ignore', '.netherite/local/activity.jsonl'], {
            cwd: dir,
            encoding: 'utf8',
          }).trim(),
        ).toBe('.netherite/local/activity.jsonl')

        // Only protocol messages were on stdout: the client parsed everything without complaint.
        expect(errors).toEqual([])
        // What a person should see went to stderr.
        expect(stderr.join('')).toContain('netherite mcp: serving')
      } finally {
        await client.close()
      }
    })
  })

  test('sees a file changed outside the server', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const { client } = await connect(dir)
      try {
        await cli(dir, 'new', 'doc', 'Written by the CLI')
        // The watcher applies it within moments.
        const start = Date.now()
        let found = false
        while (!found && Date.now() - start < 8000) {
          const result = (await client.callTool({
            name: 'search',
            arguments: { query: 'Written by the CLI' },
          })) as { content: Array<{ text: string }> }
          found = JSON.parse(result.content[0]?.text ?? '{}').total > 0
          if (!found) await new Promise((r) => setTimeout(r, 100))
        }
        expect(found).toBe(true)
      } finally {
        await client.close()
      }
    })
  })

  test('--no-watch still works', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const { client } = await connect(dir, '--no-watch')
      try {
        expect((await client.listTools()).tools.length).toBe(13)
      } finally {
        await client.close()
      }
    })
  })

  test('without a workspace it says so on stderr and exits 2, writing nothing to stdout', async () => {
    await temp(async (dir) => {
      const result = spawnSync('node', [bin, 'mcp', '--dir', dir], { encoding: 'utf8', input: '' })
      expect(result.status).toBe(2)
      expect(result.stdout).toBe('')
      expect(result.stderr).toContain('netherite init')
    })
  })

  test('exits cleanly when the client closes its end', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const result = spawnSync('node', [bin, 'mcp', '--dir', dir, '--no-watch'], {
        encoding: 'utf8',
        input: '',
        timeout: 10000,
      })
      expect(result.status).toBe(0)
      expect(result.stdout).toBe('')
    })
  })
})

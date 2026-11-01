import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { devNull, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeServices } from '@effect/platform-node'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { openRepo, type Repo } from '@netherite/core'
import { cleanWorkspaceFiles } from '@netherite/testing'
import { Effect } from 'effect'
import { createMcpServer, type McpOptions } from '../src/index'

export const isolateGit = () => {
  process.env.GIT_CONFIG_GLOBAL = devNull
  process.env.GIT_CONFIG_SYSTEM = devNull
}

export interface Session {
  readonly dir: string
  readonly repo: Repo
  readonly client: Client
  /** Calls a tool and parses its JSON result. */
  readonly call: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<{ isError: boolean; data: any }>
  readonly read: (path: string) => string
  readonly invalidate: () => void
  readonly close: () => Promise<void>
}

export const provide = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) =>
  Effect.runPromise(effect.pipe(Effect.provide(NodeServices.layer)))

/** A temporary workspace, an MCP server over it, and a client connected to the server. */
export interface SessionOptions extends McpOptions {
  /** Build the workspace's files for a temporary folder. Default: the clean sample workspace. */
  readonly files?: (dir: string) => Record<string, string>
  /** Use this existing folder instead of a temporary one. Nothing is written or deleted there. */
  readonly existing?: string
}

export const session = async (options: SessionOptions = {}): Promise<Session> => {
  const dir = options.existing ?? realpathSync(mkdtempSync(join(tmpdir(), 'netherite-mcp-')))
  if (options.existing === undefined) {
    const files = (options.files ?? cleanWorkspaceFiles)(dir)
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, text)
    }
  }
  const repo = await provide(openRepo(dir))
  const handle = await provide(createMcpServer(repo, options))
  const client = new Client({ name: 'test', version: '1.0.0' })
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  await Promise.all([handle.server.connect(serverSide), client.connect(clientSide)])

  return {
    dir,
    repo,
    client,
    invalidate: handle.invalidate,
    read: (path) => readFileSync(join(dir, path), 'utf8'),
    call: async (name, args = {}) => {
      const result = (await client.callTool({ name, arguments: args })) as {
        isError?: boolean
        content: Array<{ type: string; text: string }>
      }
      return {
        isError: result.isError === true,
        data: JSON.parse(result.content[0]?.text ?? 'null'),
      }
    },
    close: async () => {
      await client.close()
      if (options.existing === undefined) rmSync(dir, { recursive: true, force: true })
    },
  }
}

export const withSession = async <A>(
  use: (s: Session) => Promise<A>,
  options: SessionOptions = {},
) => {
  const s = await session(options)
  try {
    return await use(s)
  } finally {
    await s.close()
  }
}

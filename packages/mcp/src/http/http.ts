import { randomUUID } from 'node:crypto'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { Repo } from '@netherite/core'
import { Effect } from 'effect'
import { createMcpServer, type McpOptions } from '../server'

export interface McpHttp {
  readonly handle: (request: Request) => Promise<Response>
  readonly close: () => Promise<void>
  readonly sessions: () => number
}

const rpcError = (status: number, code: number, message: string) =>
  new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), {
    status,
    headers: { 'content-type': 'application/json' },
  })

export const createMcpHttp = (repo: Repo, options: McpOptions = {}) =>
  Effect.gen(function* () {
    const sessions = new Map<string, WebStandardStreamableHTTPServerTransport>()
    const context = yield* Effect.context()
    const open = () =>
      Effect.runPromiseWith(context)(
        Effect.gen(function* () {
          const handle = yield* createMcpServer(repo, options)
          const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: randomUUID,
            onsessioninitialized: (id) => void sessions.set(id, transport),
          })
          transport.onclose = () => {
            if (transport.sessionId !== undefined) sessions.delete(transport.sessionId)
          }
          yield* Effect.promise(() => handle.server.connect(transport))
          return transport
        }) as Effect.Effect<WebStandardStreamableHTTPServerTransport>,
      )

    const http: McpHttp = {
      sessions: () => sessions.size,
      handle: async (request) => {
        const id = request.headers.get('mcp-session-id')
        if (id !== null) {
          const transport = sessions.get(id)
          return transport === undefined
            ? rpcError(404, -32001, 'Session not found')
            : transport.handleRequest(request)
        }
        if (request.method !== 'POST')
          return rpcError(400, -32000, 'Bad request: no session; send an initialize request first')
        const transport = await open()
        const response = await transport.handleRequest(request)
        if (transport.sessionId === undefined) await transport.close()
        return response
      },
      close: async () => {
        await Promise.all([...sessions.values()].map((t) => t.close()))
        sessions.clear()
      },
    }
    return http
  })

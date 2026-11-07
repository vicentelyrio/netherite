import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import type { OpEnv, Repo } from '@netherite/core'
import { Effect } from 'effect'
import { ArgReader } from '../args'
import { describeError } from '../errors'
import { toolDefinitions } from '../tools'
import { createToolContext, recordActivity } from './createToolContext'
import { toolHandlers } from './handlers'
import { instructions } from './instructions'
import { resourceReaders } from './resources/readers'
import { resourceList } from './resources/resourceList'
import { resourceTemplates } from './resources/resourceTemplates'
import { makeSerial } from './serial'
import type { McpHandle, McpOptions, Written } from './server.types'

const serverName = 'netherite'
const unknownVersion = '0.0.0'
const resourceUri = /^netherite:\/\/(item|schema|context|timeline|stats)(?:\/(.+))?$/

export const createMcpServer = (repo: Repo, options: McpOptions = {}) =>
  Effect.gen(function* () {
    const context = yield* Effect.context<OpEnv>()
    const run = Effect.runPromiseWith(context)
    const server = new Server(
      { name: serverName, version: options.version ?? unknownVersion },
      { capabilities: { tools: {}, resources: {} }, instructions },
    )
    const ctx = createToolContext(repo, options, run as never)
    const handlers = toolHandlers(ctx)
    const serial = makeSerial()
    const tools = toolDefinitions(repo)

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools] }))
    server.setRequestHandler(CallToolRequestSchema, (request) =>
      serial(async () => {
        const name = request.params.name
        const entry = handlers[name]
        if (entry === undefined) {
          throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${name}`)
        }
        try {
          ctx.clearWritten()
          const result = await entry.handle(
            new ArgReader((request.params.arguments ?? {}) as Record<string, unknown>),
          )
          const done = ctx.written() as Written | undefined
          if (entry.write && result.isError !== true && done !== undefined) {
            await recordActivity(ctx, name, done)
            options.onWrite?.({ tool: name, ...done })
          }
          ctx.clearWritten()
          return result
        } catch (error) {
          console.error('[netherite mcp] unexpected error in', name, error)
          return describeError(error)
        }
      }),
    )
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: resourceList,
    }))
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates,
    }))
    server.setRequestHandler(ReadResourceRequestSchema, (request) =>
      serial(async () => {
        const uri = request.params.uri
        const parsed = resourceUri.exec(uri)
        if (parsed === null) throw new McpError(ErrorCode.InvalidParams, `Unknown resource: ${uri}`)
        const [, kind, rest] = parsed
        return (await (
          resourceReaders[kind as string] as NonNullable<(typeof resourceReaders)[string]>
        )(ctx, uri, rest)) as never
      }),
    )

    const handle: McpHandle = { server, invalidate: () => ctx.cache.invalidate() }
    return handle
  })

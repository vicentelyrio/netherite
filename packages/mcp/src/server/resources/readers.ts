import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import {
  buildContext,
  ContextTargetName,
  itemJsonSchemas,
  itemTypes,
  periodStats,
  timelineOf,
} from '@netherite/core'
import type { ToolContext } from '../server.types'
import { MimeType } from './resourceList'

export type ResourceContents = {
  readonly contents: ReadonlyArray<{ uri: string; mimeType: string; text: string }>
}

type Reader = (
  ctx: ToolContext,
  uri: string,
  rest: string | undefined,
) => Promise<ResourceContents> | ResourceContents

const periods: ReadonlySet<string> = new Set(['30d', 'quarter', 'year'])
const defaultPeriod = '30d'
const noGit = 'This needs a workspace in a git repository.'

const json = (uri: string, data: unknown): ResourceContents => ({
  contents: [{ uri, mimeType: MimeType.Json, text: JSON.stringify(data, null, 2) }],
})

const pastOf = async (ctx: ToolContext) => {
  const past = await ctx.history()
  if (past === undefined) throw new McpError(ErrorCode.InvalidRequest, noGit)
  return past
}

export const resourceReaders: Readonly<Record<string, Reader>> = {
  context: ({ repo }, uri) => {
    const bundle = buildContext(repo.index, {
      budget: repo.workspace.config.context.budget,
      target: ContextTargetName.Mcp,
    })
    const note =
      bundle.omitted.length > 0
        ? `\n\n<!-- Left out for the token budget: ${bundle.omitted.map((o) => o.id).join(', ')} -->`
        : ''
    return { contents: [{ uri, mimeType: MimeType.Markdown, text: bundle.text + note }] }
  },
  timeline: async (ctx, uri) =>
    json(uri, timelineOf(ctx.repo, await pastOf(ctx), { now: new Date().toISOString() })),
  stats: async (ctx, uri, rest) => {
    const past = await pastOf(ctx)
    const period = rest ?? defaultPeriod
    if (!periods.has(period)) {
      throw new McpError(ErrorCode.InvalidParams, 'Period must be 30d, quarter or year')
    }
    const fresh = await ctx.freshness()
    return json(
      uri,
      periodStats(ctx.repo, past, {
        period: period as never,
        now: new Date().toISOString(),
        ...(fresh === undefined ? {} : { freshness: fresh }),
      }),
    )
  },
  schema: ({ repo }, uri, rest) => {
    const schemas = itemJsonSchemas(repo.schemas) as unknown as Record<string, unknown>
    if (rest === undefined || !(rest in schemas)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `No schema for "${rest ?? ''}". Types: ${itemTypes.join(', ')}`,
      )
    }
    return json(uri, schemas[rest])
  },
  item: ({ locate }, uri, rest) => {
    const found = locate(decodeURIComponent(rest ?? ''))
    if (found.error) {
      throw new McpError(ErrorCode.InvalidParams, `No single item has the ID ${rest}`)
    }
    return { contents: [{ uri, mimeType: MimeType.Markdown, text: found.item.parsed.source }] }
  },
}

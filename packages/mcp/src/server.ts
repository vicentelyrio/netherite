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
import {
  appendActivity,
  buildContext,
  computeFreshness,
  contentHash,
  createItem,
  deleteItem,
  type EdgeKind,
  type Freshness,
  type GitRepository,
  type ItemType,
  itemJsonSchemas,
  itemTypes,
  link,
  lint,
  markReviewed,
  type OpEnv,
  type OpResult,
  type Repo,
  type ScannedItem,
  setState,
  summarize,
  toggleChecklistItem,
  unlink,
  updateFields,
  updateSection,
} from '@netherite/core'
import { Effect } from 'effect'
import { ArgReader } from './args'
import { describeError, failure, ok, type ToolResult } from './errors'
import { toolDefinitions } from './tools'

export interface McpOptions {
  /** The repository's git, for freshness. Leave out when there is none. */
  readonly git?: GitRepository | undefined
  /** A `@handle` recorded as `created_by` on items created through this server. */
  readonly createdBy?: string | undefined
  readonly version?: string
  /** Record each write in `.netherite/local/activity.jsonl`. Default `true`. */
  readonly activity?: boolean
}

export interface McpHandle {
  readonly server: Server
  /** Tells the server files changed outside it, so cached freshness is recomputed. */
  readonly invalidate: () => void
}

const instructions = [
  'Netherite keeps goals, projects, tasks, decisions (ADRs), docs, context and runbooks as Markdown files in this repository.',
  'Address items only by ID (TASK-00042, ADR-00007), never by title. Use `search` or `list` to find IDs, `get` to read one.',
  'Write with `create`, `update`, `set_state`, `toggle_check`, `link`, `unlink`, `mark_reviewed`. Every write is validated first; errors name the field to fix.',
  'Pass the `hash` from `get` as `base_hash` when editing, so you never overwrite a change made since.',
  "Nothing is committed for you. Run `lint` after a batch of changes. Read the `netherite://context` resource for this project's conventions.",
].join('\n')

type Fields = Record<string, unknown>

const fieldsOf = (item: ScannedItem): Fields => {
  const data = item.parsed.frontmatter?.data
  return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Fields) : {}
}

const summary = (item: ScannedItem) => {
  const f = fieldsOf(item)
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    path: item.path,
    ...(typeof f.status === 'string' ? { status: f.status } : {}),
    ...(typeof f.state === 'string' ? { state: f.state } : {}),
    ...(typeof f.project === 'string' ? { project: f.project } : {}),
    ...(Array.isArray(f.labels) ? { labels: f.labels } : {}),
  }
}

const matches = (
  item: ScannedItem,
  filter: { status?: string | undefined; project?: string | undefined; tag?: string | undefined },
) => {
  const f = fieldsOf(item)
  if (filter.status !== undefined && f.status !== filter.status && f.state !== filter.status)
    return false
  if (
    filter.project !== undefined &&
    f.project !== filter.project &&
    !(Array.isArray(f.goals) && f.goals.includes(filter.project))
  )
    return false
  if (filter.tag !== undefined) {
    const tags = [
      ...(Array.isArray(f.tags) ? f.tags : []),
      ...(Array.isArray(f.labels) ? f.labels : []),
    ]
    if (!tags.includes(filter.tag)) return false
  }
  return true
}

const opSummary = (r: OpResult) => ({
  id: r.id,
  path: r.path,
  hash: r.hash,
  changed: r.changed,
  unchanged: r.unchanged,
})

/**
 * Builds the MCP server (ADR-00012): tools and resources over a repo. It uses the SDK's
 * low-level `Server` so tool inputs are plain JSON Schema generated from the item schemas.
 * Every write goes through core operations, so it is validated, format-preserving and atomic.
 * Calls run one at a time, so concurrent writes cannot interleave.
 */
export const createMcpServer = (repo: Repo, options: McpOptions = {}) =>
  Effect.gen(function* () {
    const context = yield* Effect.context<OpEnv>()
    const run = Effect.runPromiseWith(context)

    const server = new Server(
      { name: 'netherite', version: options.version ?? '0.0.0' },
      { capabilities: { tools: {}, resources: {} }, instructions },
    )

    // Freshness covers the whole index, so it is computed on demand and kept until something changes.
    let generation = 0
    let cached: { generation: number; map: ReadonlyMap<string, Freshness> } | undefined
    const freshness = async (): Promise<ReadonlyMap<string, Freshness> | undefined> => {
      if (options.git === undefined) return undefined
      if (cached?.generation === generation) return cached.map
      const map = await run(
        computeFreshness({
          index: repo.index,
          git: options.git,
          thresholds: repo.workspace.config.freshness,
          root: repo.workspace.root,
        }).pipe(Effect.orElseSucceed(() => undefined)),
      )
      if (map === undefined) return undefined
      cached = { generation, map }
      return map
    }
    options.git?.invalidate()

    const locate = (id: string) => {
      const found = repo.index.findById(id)
      if (found.length === 0)
        return {
          error: describeError({ _tag: 'NotFound', message: `No item has the ID ${id}`, id }),
        }
      if (found.length > 1) {
        return {
          error: describeError({
            _tag: 'AmbiguousId',
            message: `${id} is used by ${found.length} items`,
            id,
            paths: found.map((i) => i.path),
          }),
        }
      }
      return { item: found[0] as ScannedItem }
    }

    // ---- tools --------------------------------------------------------------------------

    const withHash = (r: ArgReader) => r.string('base_hash')

    type Handler = (r: ArgReader) => Promise<ToolResult> | ToolResult

    // A write that changed something is noted in the activity log, which the Inbox reads. The
    // handler leaves a note of what it did; the dispatcher writes it once the call has succeeded.
    // Calls run one at a time, so there is only ever one note.
    type Written = { id: string; path: string; hash: string | null; changed: ReadonlyArray<string> }
    let written: Written | undefined
    const noteWrite = (value: unknown) => {
      const v = value as
        | { id?: unknown; path?: unknown; hash?: unknown; changed?: unknown; unchanged?: unknown }
        | undefined
      if (typeof v?.id !== 'string' || typeof v.path !== 'string' || v.unchanged === true) return
      written = {
        id: v.id,
        path: v.path,
        hash: typeof v.hash === 'string' ? v.hash : null,
        changed: Array.isArray(v.changed) ? (v.changed as string[]) : [v.path],
      }
    }
    const record = async (tool: string, entry: Written) => {
      if (options.activity === false) return
      const outcome = await run(
        Effect.result(appendActivity(repo.workspace, { tool, actor: 'mcp', ...entry })),
      )
      if (outcome._tag === 'Failure') {
        console.error('[netherite mcp] could not write the activity log:', outcome.failure.message)
      }
    }

    const effectTool =
      <A>(
        build: (r: ArgReader) => Effect.Effect<A, unknown, OpEnv> | undefined,
        format: (a: A) => unknown,
      ): Handler =>
      async (r) => {
        const effect = build(r)
        const problem = r.check()
        if (problem !== undefined) return describeError(problem)
        if (effect === undefined)
          return failure({ type: 'InternalError', message: 'Nothing to do' })
        const outcome = await run(Effect.result(effect))
        if (outcome._tag === 'Failure') return describeError(outcome.failure)
        generation++
        noteWrite(outcome.success)
        return ok(format(outcome.success))
      }

    const handlers: Record<string, { write: boolean; handle: Handler }> = {
      search: {
        write: false,
        handle: (r) => {
          const query = r.string('query', { required: true })
          const types = r.strings('types')
          const status = r.string('status')
          const project = r.string('project')
          const tag = r.string('tag')
          const limit = r.integer('limit', { min: 1, max: 100 }) ?? 20
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          const wide = repo.index.search(query as string, {
            ...(types === undefined ? {} : { types }),
            limit: limit * 10,
          })
          const results = wide
            .flatMap((hit) => {
              const item = repo.index.get(hit.path)
              return item !== undefined && matches(item, { status, project, tag })
                ? [{ ...summary(item), score: Math.round(hit.score * 100) / 100 }]
                : []
            })
            .slice(0, limit)
          return ok({ total: results.length, results })
        },
      },

      get: {
        write: false,
        handle: async (r) => {
          const id = r.id('id')
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          const found = locate(id as string)
          if (found.error) return found.error
          const item = found.item as ScannedItem
          const link_ = (edge: { kind: EdgeKind; from: string; to: string }, other: string) => {
            const target = repo.index.get(other)
            return { kind: edge.kind, id: target?.id, title: target?.title, path: other }
          }
          const fresh = (await freshness())?.get(item.path)
          return ok({
            ...summary(item),
            hash: contentHash(item.parsed.source),
            frontmatter: item.parsed.frontmatter?.data ?? null,
            body: item.parsed.source.slice(item.parsed.bodyStart).replace(/^\r?\n/, ''),
            links: repo.index.outgoing(item.path).map((e) => link_(e, e.to)),
            backlinks: repo.index.backlinks(item.path).map((e) => link_(e, e.from)),
            unresolved: repo.index
              .refs(item.path)
              .filter(({ resolution }) => resolution.status !== 'resolved')
              .map(({ ref, resolution }) => ({
                target: ref.target,
                field: ref.field,
                status: resolution.status,
              })),
            progress: repo.index.progress(item.path) ?? null,
            orphan: repo.index.isOrphan(item.path),
            freshness:
              fresh && fresh.state !== 'not-tracked'
                ? {
                    state: fresh.state,
                    commits: fresh.commits,
                    since: fresh.baseline?.date ?? null,
                    atLeast: fresh.atLeast,
                  }
                : null,
          })
        },
      },

      list: {
        write: false,
        handle: (r) => {
          const type = r.oneOf('type', itemTypes)
          const status = r.string('status')
          const project = r.string('project')
          const tag = r.string('tag')
          const limit = r.integer('limit', { min: 1, max: 500 }) ?? 50
          const offset = r.integer('offset', { min: 0 }) ?? 0
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          const all = repo.index
            .items()
            .filter(
              (item) =>
                (type === undefined || item.type === type) &&
                matches(item, { status, project, tag }),
            )
            .sort((a, b) => (a.id ?? a.path).localeCompare(b.id ?? b.path))
          return ok({
            total: all.length,
            offset,
            items: all.slice(offset, offset + limit).map(summary),
          })
        },
      },

      create: {
        write: true,
        handle: effectTool((r) => {
          const type = r.oneOf('type', itemTypes, true)
          const title = r.string('title', { required: true })
          const fields = r.object('fields')
          const body = r.string('body')
          const createdBy = r.string('created_by') ?? options.createdBy
          if (type === undefined || title === undefined) return undefined
          return createItem(repo, {
            type: type as ItemType,
            title,
            ...(fields === undefined ? {} : { fields: fields as never }),
            ...(body === undefined ? {} : { body }),
            ...(createdBy === undefined ? {} : { createdBy }),
          })
        }, opSummary),
      },

      update: {
        write: true,
        handle: async (r) => {
          const id = r.id('id')
          const set = r.object('set')
          const unset = r.strings('unset')
          const section = r.object('section')
          const baseHash = withHash(r)
          const heading =
            section && typeof section.heading === 'string' ? section.heading : undefined
          const content =
            section && typeof section.content === 'string' ? section.content : undefined
          const mode = section?.mode
          if (section !== undefined) {
            if (heading === undefined)
              r.issues.push({ path: ['section', 'heading'], message: 'Required' })
            if (content === undefined)
              r.issues.push({ path: ['section', 'content'], message: 'Required' })
            if (
              mode !== undefined &&
              mode !== 'replace' &&
              mode !== 'append' &&
              mode !== 'create'
            ) {
              r.issues.push({
                path: ['section', 'mode'],
                message: 'Must be one of: replace, append, create',
              })
            }
          }
          if (set === undefined && unset === undefined && section === undefined) {
            r.issues.push({ path: [], message: 'Give at least one of set, unset or section' })
          }
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          const steps = Effect.gen(function* () {
            let result: OpResult | undefined
            let hash = baseHash
            const changed = new Set<string>()
            if (set !== undefined || unset !== undefined) {
              result = yield* updateFields(
                repo,
                id as string,
                { ...(set ? { set: set as never } : {}), ...(unset ? { unset } : {}) },
                hash ? { baseHash: hash } : {},
              )
              hash = result.hash
              for (const c of result.changed) changed.add(c)
            }
            if (heading !== undefined && content !== undefined) {
              result = yield* updateSection(
                repo,
                id as string,
                {
                  heading,
                  content,
                  mode: (mode as 'replace' | 'append' | 'create' | undefined) ?? 'replace',
                },
                hash ? { baseHash: hash } : {},
              )
              for (const c of result.changed) changed.add(c)
            }
            return result === undefined
              ? undefined
              : { ...opSummary(result), changed: [...changed], unchanged: changed.size === 0 }
          })
          const outcome = await run(Effect.result(steps))
          if (outcome._tag === 'Failure') return describeError(outcome.failure)
          generation++
          noteWrite(outcome.success)
          return ok(outcome.success)
        },
      },

      set_state: {
        write: true,
        handle: effectTool((r) => {
          const id = r.id('id')
          const state = r.string('state', { required: true })
          const by = r.id('superseded_by', false)
          const baseHash = withHash(r)
          if (id === undefined || state === undefined) return undefined
          return setState(repo, id, state, {
            ...(by ? { supersededBy: by } : {}),
            ...(baseHash ? { baseHash } : {}),
          })
        }, opSummary),
      },

      toggle_check: {
        write: true,
        handle: effectTool((r) => {
          const id = r.id('id')
          const raw = r.raw('item')
          const checked = r.boolean('checked')
          const baseHash = withHash(r)
          const which =
            typeof raw === 'number' && Number.isInteger(raw) && raw >= 0
              ? raw
              : typeof raw === 'string' && raw !== ''
                ? { text: raw }
                : undefined
          if (which === undefined)
            r.issues.push({
              path: ['item'],
              message: 'Give the 0-based position or the exact text of the checklist item',
            })
          if (id === undefined || which === undefined) return undefined
          return toggleChecklistItem(repo, id, which, checked, baseHash ? { baseHash } : {})
        }, opSummary),
      },

      link: { write: true, handle: relation('link') },
      unlink: { write: true, handle: relation('unlink') },

      delete: {
        write: true,
        handle: effectTool(
          (r) => {
            const id = r.id('id')
            const force = r.boolean('force')
            const baseHash = withHash(r)
            if (id === undefined) return undefined
            return deleteItem(repo, id, {
              ...(force ? { force } : {}),
              ...(baseHash ? { baseHash } : {}),
            })
          },
          (d) => ({ deleted: d.id, path: d.path }),
        ),
      },

      mark_reviewed: {
        write: true,
        handle: effectTool((r) => {
          const id = r.id('id')
          const date = r.string('date', { pattern: /^\d{4}-\d{2}-\d{2}$/ })
          const baseHash = withHash(r)
          if (id === undefined) return undefined
          return markReviewed(repo, id, {
            ...(date ? { date } : {}),
            ...(baseHash ? { baseHash } : {}),
          })
        }, opSummary),
      },

      lint: {
        write: false,
        handle: async (r) => {
          const id = r.id('id', false)
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          let only: string[] | undefined
          if (id !== undefined) {
            const found = locate(id)
            if (found.error) return found.error
            only = [(found.item as ScannedItem).path]
          }
          const fresh = await freshness()
          const diagnostics = lint(repo.index, {
            config: repo.workspace.config,
            contentRoot: repo.contentRoot,
            ...(only ? { only } : {}),
            ...(fresh ? { freshness: fresh } : {}),
          })
          return ok({ summary: summarize(diagnostics), diagnostics })
        },
      },

      context: {
        write: false,
        handle: (r) => {
          const project = r.id('project', false)
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          const bundle = buildContext(repo.index, {
            budget: repo.workspace.config.context.budget,
            target: 'mcp',
            ...(project ? { project } : {}),
          })
          return ok(bundle)
        },
      },
    }

    function relation(kind: 'link' | 'unlink'): Handler {
      const op = kind === 'link' ? link : unlink
      return effectTool((r) => {
        const from = r.id('from')
        const to = r.id('to')
        const relationKind = r.oneOf(
          'kind',
          ['belongs_to', 'implements', 'explains', 'supersedes', 'depends_on', 'related'] as const,
          true,
        )
        const baseHash = withHash(r)
        if (from === undefined || to === undefined || relationKind === undefined) return undefined
        return op(repo, { from, to, kind: relationKind as EdgeKind }, baseHash ? { baseHash } : {})
      }, opSummary)
    }

    // Calls run one at a time, in the order they arrive.
    let queue: Promise<unknown> = Promise.resolve()
    const serial = <A>(work: () => Promise<A>): Promise<A> => {
      const next = queue.then(work, work)
      queue = next.catch(() => undefined)
      return next
    }

    const tools = toolDefinitions(repo)
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools] }))
    server.setRequestHandler(CallToolRequestSchema, (request) =>
      serial(async () => {
        const entry = handlers[request.params.name]
        if (entry === undefined) {
          throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${request.params.name}`)
        }
        try {
          written = undefined
          const result = await entry.handle(
            new ArgReader((request.params.arguments ?? {}) as Fields),
          )
          if (entry.write && result.isError !== true && written !== undefined) {
            await record(request.params.name, written)
          }
          written = undefined
          return result
        } catch (error) {
          // Never let a bug close the connection; say so, log it for the person running the server.
          console.error('[netherite mcp] unexpected error in', request.params.name, error)
          return describeError(error)
        }
      }),
    )

    // ---- resources ----------------------------------------------------------------------

    const schemas = itemJsonSchemas(repo.schemas) as unknown as Record<string, unknown>
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'netherite://context',
          name: 'Agent context',
          description: 'Curated context for agents, within the token budget.',
          mimeType: 'text/markdown',
        },
        ...itemTypes.map((type) => ({
          uri: `netherite://schema/${type}`,
          name: `Schema: ${type}`,
          description: `JSON Schema for the fields of a ${type}.`,
          mimeType: 'application/json',
        })),
      ],
    }))
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [
        {
          uriTemplate: 'netherite://item/{id}',
          name: 'Item',
          description: 'The raw Markdown file of an item, by ID.',
          mimeType: 'text/markdown',
        },
        {
          uriTemplate: 'netherite://schema/{type}',
          name: 'Schema',
          description: 'JSON Schema for an item type.',
          mimeType: 'application/json',
        },
      ],
    }))
    server.setRequestHandler(ReadResourceRequestSchema, (request) =>
      serial(async () => {
        const uri = request.params.uri
        const parsed = /^netherite:\/\/(item|schema|context)(?:\/(.+))?$/.exec(uri)
        if (parsed === null) throw new McpError(ErrorCode.InvalidParams, `Unknown resource: ${uri}`)
        const [, kind, rest] = parsed
        if (kind === 'context') {
          const bundle = buildContext(repo.index, {
            budget: repo.workspace.config.context.budget,
            target: 'mcp',
          })
          const note =
            bundle.omitted.length > 0
              ? `\n\n<!-- Left out for the token budget: ${bundle.omitted.map((o) => o.id).join(', ')} -->\n`
              : ''
          return { contents: [{ uri, mimeType: 'text/markdown', text: bundle.text + note }] }
        }
        if (kind === 'schema') {
          if (rest === undefined || !(rest in schemas))
            throw new McpError(
              ErrorCode.InvalidParams,
              `No schema for "${rest ?? ''}". Types: ${itemTypes.join(', ')}`,
            )
          return {
            contents: [
              { uri, mimeType: 'application/json', text: JSON.stringify(schemas[rest], null, 2) },
            ],
          }
        }
        const found = locate(decodeURIComponent(rest ?? ''))
        if (found.error)
          throw new McpError(ErrorCode.InvalidParams, `No single item has the ID ${rest}`)
        return {
          contents: [
            { uri, mimeType: 'text/markdown', text: (found.item as ScannedItem).parsed.source },
          ],
        }
      }),
    )

    const handle: McpHandle = {
      server,
      invalidate: () => {
        generation++
        options.git?.invalidate()
      },
    }
    return handle
  })

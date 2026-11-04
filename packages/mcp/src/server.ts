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
  checkTargetOf,
  createItem,
  deleteItem,
  type EdgeKind,
  freshnessCache,
  type GitRepository,
  graphAsOf,
  type History,
  type ItemType,
  itemDetail,
  itemJsonSchemas,
  itemTypes,
  lifecycles,
  link,
  lint,
  listItems,
  markReviewed,
  type OpEnv,
  type OpResult,
  periodStats,
  type Repo,
  readHistory,
  type ScannedItem,
  searchItems,
  setState,
  summarize,
  timelineOf,
  toggleChecklistItem,
  unlink,
  updateItem,
  withWorkingTree,
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
  /** Called after every write that changed something, for example to tell browsers about it. */
  readonly onWrite?: (write: {
    readonly tool: string
    readonly id: string
    readonly path: string
    readonly hash: string | null
    readonly changed: ReadonlyArray<string>
  }) => void
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
    const cache = freshnessCache(repo, options.git)
    const freshness = () => run(cache.get)

    // The git history is read once per commit, for the `as_of` views.
    let cachedHistory: { head: string | undefined; history: History } | undefined
    const history = () =>
      run(
        Effect.gen(function* () {
          const git = options.git
          if (git === undefined) return undefined
          const head = yield* git.head
          const hit = cachedHistory
          if (hit !== undefined && hit.head === head) {
            return withWorkingTree(hit.history, repo.index, new Date().toISOString())
          }
          const read = yield* readHistory(git, repo.workspace.root, {
            contentRoot: repo.contentRoot,
          })
          cachedHistory = { head, history: read }
          return withWorkingTree(read, repo.index, new Date().toISOString())
        }),
      )
    const asOfProblem = (value: string | undefined) =>
      value !== undefined &&
      (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/u.test(value) ||
        Number.isNaN(Date.parse(value)))
        ? describeError({
            _tag: 'ValidationError',
            issues: [{ path: ['as_of'], message: 'Use a date such as 2026-03-01' }],
          })
        : undefined
    const noHistory = () =>
      describeError({
        _tag: 'Unavailable',
        message: 'as_of needs a workspace in a git repository.',
      })

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
        cache.invalidate()
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
          return ok(searchItems(repo, query as string, { types, status, project, tag, limit }))
        },
      },

      get: {
        write: false,
        handle: async (r) => {
          const id = r.id('id')
          const asOf = r.string('as_of')
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          const badDate = asOfProblem(asOf)
          if (badDate !== undefined) return badDate
          const found = locate(id as string)
          if (found.error) return found.error
          const item = found.item as ScannedItem
          if (asOf !== undefined) {
            const past = await history()
            if (past === undefined) return noHistory()
            const now = new Date().toISOString()
            const graph = graphAsOf(repo, past, { asOf, now })
            const node = graph.nodes.find((n) => n.id === id)
            const life = lifecycles(past, { states: repo.workspace.config.states, now }).get(
              id as string,
            )
            const until = Date.parse(graph.asOf)
            return ok({
              id,
              asOf: graph.asOf,
              existed: node !== undefined,
              approximate: graph.approximate,
              ...(node === undefined ? {} : { state: node }),
              events: (life?.events ?? []).filter((e) => Date.parse(e.date) <= until),
            })
          }
          return ok(itemDetail(repo, item, await freshness()))
        },
      },

      list: {
        write: false,
        handle: async (r) => {
          const type = r.oneOf('type', itemTypes)
          const status = r.string('status')
          const project = r.string('project')
          const tag = r.string('tag')
          const limit = r.integer('limit', { min: 1, max: 500 }) ?? 50
          const offset = r.integer('offset', { min: 0 }) ?? 0
          const asOf = r.string('as_of')
          const problem = r.check()
          if (problem !== undefined) return describeError(problem)
          const badDate = asOfProblem(asOf)
          if (badDate !== undefined) return badDate
          if (asOf !== undefined) {
            if (tag !== undefined)
              return describeError({
                _tag: 'ValidationError',
                issues: [{ path: ['tag'], message: 'tag cannot be combined with as_of' }],
              })
            const past = await history()
            if (past === undefined) return noHistory()
            const graph = graphAsOf(repo, past, { asOf, now: new Date().toISOString() })
            const all = graph.nodes
              .filter(
                (n) =>
                  (type === undefined || n.type === type) &&
                  (project === undefined || n.parent === project) &&
                  (status === undefined || n.status === status),
              )
              .sort((a, b) => a.id.localeCompare(b.id))
            return ok({
              asOf: graph.asOf,
              approximate: graph.approximate,
              total: all.length,
              offset,
              items: all.slice(offset, offset + limit),
            })
          }
          return ok(listItems(repo, { type, status, project, tag, limit, offset }))
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
          const steps = updateItem(
            repo,
            id as string,
            {
              ...(set ? { set: set as never } : {}),
              ...(unset ? { unset } : {}),
              ...(heading !== undefined && content !== undefined
                ? {
                    section: {
                      heading,
                      content,
                      mode: (mode as 'replace' | 'append' | 'create' | undefined) ?? 'replace',
                    },
                  }
                : {}),
            },
            baseHash ? { baseHash } : {},
          ).pipe(Effect.map((result) => (result === undefined ? undefined : opSummary(result))))
          const outcome = await run(Effect.result(steps))
          if (outcome._tag === 'Failure') return describeError(outcome.failure)
          cache.invalidate()
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
        handle: effectTool(
          (r) => {
            const id = r.id('id')
            const raw = r.raw('item')
            const rawItems = r.raw('items')
            const baseHash = withHash(r)
            const ask = checkTargetOf({
              ...(raw === undefined ? {} : { item: raw as number | string }),
              ...(rawItems === undefined
                ? {}
                : { items: rawItems as ReadonlyArray<number | string> }),
              ...(r.boolean('all') === undefined ? {} : { all: r.boolean('all') as boolean }),
              ...(r.boolean('checked') === undefined
                ? {}
                : { checked: r.boolean('checked') as boolean }),
            })
            if ('problem' in ask) {
              r.issues.push({ path: ['item'], message: ask.problem })
              return undefined
            }
            if (id === undefined) return undefined
            return toggleChecklistItem(
              repo,
              id,
              ask.target,
              ask.checked,
              baseHash ? { baseHash } : {},
            )
          },
          (r) => ({
            ...opSummary(r),
            // The whole checklist as it is now, so the caller can see what the write did.
            checklist: (repo.index.get(r.path)?.parsed.checklist ?? []).map((c, i) => ({
              index: i,
              text: c.text,
              checked: c.checked,
            })),
          }),
        ),
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
            new ArgReader((request.params.arguments ?? {}) as Record<string, unknown>),
          )
          const done = written as Written | undefined
          if (entry.write && result.isError !== true && done !== undefined) {
            await record(request.params.name, done)
            options.onWrite?.({ tool: request.params.name, ...done })
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
        {
          uri: 'netherite://timeline',
          name: 'Timeline',
          description:
            'Goals, projects, tasks and decisions on one time axis, with holds, due dates and overdue flags. Needs git.',
          mimeType: 'application/json',
        },
        {
          uri: 'netherite://stats',
          name: 'Stats (30 days)',
          description:
            'Tasks created and done, cycle time, goal areas and knowledge health over 30 days, against the 30 before. Needs git.',
          mimeType: 'application/json',
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
          uriTemplate: 'netherite://stats/{period}',
          name: 'Stats',
          description: 'The same for a period: 30d, quarter or year. Needs git.',
          mimeType: 'application/json',
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
        const parsed = /^netherite:\/\/(item|schema|context|timeline|stats)(?:\/(.+))?$/.exec(uri)
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
        if (kind === 'timeline' || kind === 'stats') {
          const past = await history()
          if (past === undefined)
            throw new McpError(
              ErrorCode.InvalidRequest,
              'This needs a workspace in a git repository.',
            )
          const now = new Date().toISOString()
          let data: unknown
          if (kind === 'timeline') {
            data = timelineOf(repo, past, { now })
          } else {
            const period = rest ?? '30d'
            if (period !== '30d' && period !== 'quarter' && period !== 'year')
              throw new McpError(ErrorCode.InvalidParams, 'Period must be 30d, quarter or year')
            const fresh = await freshness()
            data = periodStats(repo, past, {
              period,
              now,
              ...(fresh === undefined ? {} : { freshness: fresh }),
            })
          }
          return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
          }
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
      invalidate: () => cache.invalidate(),
    }
    return handle
  })

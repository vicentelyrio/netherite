import type { Server } from '@modelcontextprotocol/sdk/server/index.js'
import type {
  Freshness,
  FreshnessCache,
  GitRepository,
  History,
  OpEnv,
  Repo,
  ScannedItem,
} from '@netherite/core'
import type { Effect } from 'effect'
import type { ArgReader } from '../args'
import type { ToolResult } from '../errors'

export interface WriteNote {
  readonly tool: string
  readonly id: string
  readonly path: string
  readonly hash: string | null
  readonly changed: ReadonlyArray<string>
}

export interface McpOptions {
  readonly git?: GitRepository | undefined
  readonly createdBy?: string | undefined
  readonly version?: string
  readonly activity?: boolean
  readonly onWrite?: (write: WriteNote) => void
}

export interface McpHandle {
  readonly server: Server
  readonly invalidate: () => void
}

export type Handler = (r: ArgReader) => Promise<ToolResult> | ToolResult

export interface ToolEntry {
  readonly write: boolean
  readonly handle: Handler
}

export type Written = Omit<WriteNote, 'tool'>

export type Located =
  | { readonly item: ScannedItem; readonly error?: undefined }
  | { readonly item?: undefined; readonly error: ToolResult }

export interface ToolContext {
  readonly repo: Repo
  readonly options: McpOptions
  readonly run: <A, E>(effect: Effect.Effect<A, E, OpEnv>) => Promise<A>
  readonly cache: FreshnessCache
  readonly freshness: () => Promise<ReadonlyMap<string, Freshness> | undefined>
  readonly history: () => Promise<History | undefined>
  readonly asOfProblem: (value: string | undefined) => ToolResult | undefined
  readonly noHistory: () => ToolResult
  readonly locate: (id: string) => Located
  readonly withHash: (r: ArgReader) => string | undefined
  readonly effectTool: <A>(
    build: (r: ArgReader) => Effect.Effect<A, unknown, OpEnv> | undefined,
    format: (a: A) => unknown,
  ) => Handler
  readonly noteWrite: (value: unknown) => void
  readonly written: () => Written | undefined
  readonly clearWritten: () => void
}

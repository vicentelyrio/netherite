import { Clock, Effect, FileSystem, Path } from 'effect'
import { IoError } from '../errors'
import type { Workspace } from '../workspace'

export const activityFile = '.netherite/local/activity.jsonl'

export interface ActivityEntry {
  readonly time: string
  readonly tool: string
  readonly id: string
  readonly path: string
  readonly hash: string | null
  readonly changed: ReadonlyArray<string>
  readonly actor?: string
}

export type NewActivity = Omit<ActivityEntry, 'time'>

const isEntry = (value: unknown): value is ActivityEntry => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.time === 'string' &&
    typeof v.tool === 'string' &&
    typeof v.id === 'string' &&
    typeof v.path === 'string' &&
    (typeof v.hash === 'string' || v.hash === null) &&
    Array.isArray(v.changed) &&
    v.changed.every((c) => typeof c === 'string') &&
    (v.actor === undefined || typeof v.actor === 'string')
  )
}

export const appendActivity = (workspace: Pick<Workspace, 'root'>, entry: NewActivity) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const now = yield* Clock.currentTimeMillis
    const file = path.join(workspace.root, activityFile)
    const line: ActivityEntry = { time: new Date(now).toISOString(), ...entry }
    yield* fs.makeDirectory(path.dirname(file), { recursive: true }).pipe(
      Effect.andThen(fs.writeFileString(file, `${JSON.stringify(line)}\n`, { flag: 'a' })),
      Effect.mapError((cause) => new IoError({ path: activityFile, operation: 'write', cause })),
    )
    return line
  })

export interface ReadActivityOptions {
  readonly since?: string
  readonly ids?: ReadonlyArray<string>
  readonly tools?: ReadonlyArray<string>
  readonly limit?: number
}

export interface ActivityLog {
  readonly entries: ReadonlyArray<ActivityEntry>
  readonly skipped: number
}

export const readActivity = (
  workspace: Pick<Workspace, 'root'>,
  options: ReadActivityOptions = {},
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const file = path.join(workspace.root, activityFile)
    if (!(yield* fs.exists(file).pipe(Effect.orElseSucceed(() => false)))) {
      return { entries: [], skipped: 0 } satisfies ActivityLog
    }
    const text = yield* fs
      .readFileString(file)
      .pipe(
        Effect.mapError((cause) => new IoError({ path: activityFile, operation: 'read', cause })),
      )

    const entries: ActivityEntry[] = []
    let skipped = 0
    for (const line of text.split('\n')) {
      if (line.trim() === '') continue
      try {
        const parsed: unknown = JSON.parse(line)
        if (isEntry(parsed)) entries.push(parsed)
        else skipped++
      } catch {
        skipped++
      }
    }

    const since = options.since === undefined ? undefined : Date.parse(options.since)
    const ids = options.ids === undefined ? undefined : new Set(options.ids)
    const tools = options.tools === undefined ? undefined : new Set(options.tools)
    const wanted = entries
      .filter(
        (e) =>
          (since === undefined || Date.parse(e.time) > since) &&
          (ids === undefined || ids.has(e.id)) &&
          (tools === undefined || tools.has(e.tool)),
      )
      .reverse()
    return {
      entries: options.limit === undefined ? wanted : wanted.slice(0, Math.max(0, options.limit)),
      skipped,
    } satisfies ActivityLog
  })

export interface ItemActivity {
  readonly id: string
  readonly path: string
  readonly count: number
  readonly tools: ReadonlyArray<string>
  readonly first: string
  readonly last: string
  readonly deleted: boolean
}

export const groupActivity = (
  entries: ReadonlyArray<ActivityEntry>,
): ReadonlyArray<ItemActivity> => {
  const byId = new Map<string, { entries: ActivityEntry[] }>()
  for (const entry of entries) {
    const group = byId.get(entry.id) ?? { entries: [] }
    group.entries.push(entry)
    byId.set(entry.id, group)
  }
  return [...byId]
    .map(([id, { entries: list }]): ItemActivity => {
      const sorted = [...list].sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
      const last = sorted.at(-1) as ActivityEntry
      return {
        id,
        path: last.path,
        count: sorted.length,
        tools: [...new Set(sorted.map((e) => e.tool))],
        first: (sorted[0] as ActivityEntry).time,
        last: last.time,
        deleted: last.hash === null,
      }
    })
    .sort((a, b) => Date.parse(b.last) - Date.parse(a.last) || a.id.localeCompare(b.id))
}

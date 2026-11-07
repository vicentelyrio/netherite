import { ItemType } from '@netherite/schema'
import { Effect } from 'effect'
import type { Repo } from '../repo'
import { invalid } from './mutate'
import { updateItem } from './updateItem'

export const tagFields = ['tags', 'labels'] as const

export type TagField = (typeof tagFields)[number]

export interface TagUse {
  readonly field: TagField
  readonly name: string
  readonly total: number
  readonly byType: Readonly<Record<string, number>>
  readonly ids: ReadonlyArray<string>
}

const listOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

export const tagUsage = (repo: Repo): TagUse[] => {
  const uses = new Map<
    string,
    { field: TagField; name: string; byType: Record<string, number>; ids: string[] }
  >()
  for (const item of repo.index.items()) {
    if (item.id === undefined) continue
    const data = item.parsed.frontmatter?.data as Record<string, unknown> | undefined
    for (const field of tagFields) {
      for (const name of new Set(listOf(data?.[field]))) {
        const key = `${field}:${name}`
        const use = uses.get(key) ?? { field, name, byType: {}, ids: [] }
        const type = item.type ?? 'unknown'
        use.byType[type] = (use.byType[type] ?? 0) + 1
        use.ids.push(item.id)
        uses.set(key, use)
      }
    }
  }
  return [...uses.values()]
    .map((u) => ({ ...u, total: u.ids.length, ids: u.ids.sort() }))
    .sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name) || a.field.localeCompare(b.field),
    )
}

export interface RenameResult {
  readonly renamed: number
  readonly changed: ReadonlyArray<string>
}

export const renameTag = (repo: Repo, input: { field: TagField; from: string; to: string }) =>
  Effect.gen(function* () {
    const to = input.to.trim()
    if (to === '') return yield* invalid(['to'], 'A tag needs a name')
    if (/\s/.test(to)) return yield* invalid(['to'], 'A tag cannot contain spaces')
    if (to === input.from) return { renamed: 0, changed: [] } satisfies RenameResult
    const changed = new Set<string>()
    let renamed = 0
    for (const use of tagUsage(repo).filter(
      (u) => u.field === input.field && u.name === input.from,
    )) {
      for (const id of use.ids) {
        const item = repo.index.findById(id)[0]
        const data = item?.parsed.frontmatter?.data as Record<string, unknown> | undefined
        const next = [
          ...new Set(listOf(data?.[input.field]).map((v) => (v === input.from ? to : v))),
        ]
        const result = yield* updateItem(repo, id, { set: { [input.field]: next } })
        if (result !== undefined && !result.unchanged) renamed++
        for (const c of result?.changed ?? []) changed.add(c)
      }
    }
    return { renamed, changed: [...changed] } satisfies RenameResult
  })

export const renameArea = (repo: Repo, input: { from: string; to: string }) =>
  Effect.gen(function* () {
    const to = input.to.trim()
    if (to === '' && input.from === '') return yield* invalid(['to'], 'An area needs a name')
    if (to === input.from) return { renamed: 0, changed: [] } satisfies RenameResult
    const changed = new Set<string>()
    let renamed = 0
    for (const item of repo.index.items()) {
      if (item.id === undefined || item.type !== ItemType.Goal) continue
      const data = item.parsed.frontmatter?.data as Record<string, unknown> | undefined
      const area = typeof data?.area === 'string' && data.area !== '' ? data.area : ''
      if (area !== input.from) continue
      const result = yield* updateItem(
        repo,
        item.id,
        to === '' ? { unset: ['area'] } : { set: { area: to } },
      )
      if (result !== undefined && !result.unchanged) renamed++
      for (const c of result?.changed ?? []) changed.add(c)
    }
    return { renamed, changed: [...changed] } satisfies RenameResult
  })

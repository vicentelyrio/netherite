import { ItemType } from '@netherite/schema'
import { type TagUse, tagUsage } from '../ops/operations'
import type { Repo } from '../ops/repo'
import { fieldsOf } from '../views'
import { keyOf, nameScore, overlap } from './nameScore'
import type { TagDuplicate, TagEdge, TagMap, TagNode } from './tag-map.types'

export const tagMap = (repo: Repo): TagMap => {
  const usage = tagUsage(repo)
  const nodes = new Map(usage.map((u) => [keyOf(u), u]))
  const items = new Map(usage.map((u) => [keyOf(u), new Set(u.ids)]))

  const pairs = new Map<string, number>()
  const tagsOf = new Map<string, string[]>()
  for (const [key, ids] of items)
    for (const id of ids) tagsOf.set(id, [...(tagsOf.get(id) ?? []), key])
  for (const keys of tagsOf.values()) {
    const sorted = [...keys].sort()
    for (let i = 0; i < sorted.length; i++)
      for (let j = i + 1; j < sorted.length; j++) {
        const pair = `${sorted[i]}\u0000${sorted[j]}`
        pairs.set(pair, (pairs.get(pair) ?? 0) + 1)
      }
  }
  const ref = (key: string) => {
    const use = nodes.get(key) as TagUse
    return { field: use.field, name: use.name }
  }
  const edges: TagEdge[] = [...pairs]
    .map(([pair, count]) => {
      const [a, b] = pair.split('\u0000') as [string, string]
      return { a: ref(a), b: ref(b), count }
    })
    .sort(
      (x, y) =>
        y.count - x.count ||
        keyOf(x.a).localeCompare(keyOf(y.a)) ||
        keyOf(x.b).localeCompare(keyOf(y.b)),
    )

  const neighbours = new Map<string, Map<string, number>>()
  for (const e of edges) {
    for (const [from, to] of [
      [keyOf(e.a), keyOf(e.b)],
      [keyOf(e.b), keyOf(e.a)],
    ] as const) {
      const row = neighbours.get(from) ?? new Map<string, number>()
      row.set(to, e.count)
      neighbours.set(from, row)
    }
  }

  const areaOf = (id: string, hops = 0): string | undefined => {
    const item = repo.index.findById(id)[0]
    if (item === undefined || hops > 3) return undefined
    const f = fieldsOf(item)
    if (item.type === ItemType.Goal)
      return typeof f.area === 'string' && f.area !== '' ? f.area : undefined
    const up =
      item.type === ItemType.Project ? (Array.isArray(f.goals) ? f.goals[0] : undefined) : f.project
    return typeof up === 'string' ? areaOf(up, hops + 1) : undefined
  }
  const byArea = new Map<string, string>()
  for (const [key, ids] of items) {
    const counts = new Map<string, number>()
    for (const id of ids) {
      const area = areaOf(id)
      if (area !== undefined) counts.set(area, (counts.get(area) ?? 0) + 1)
    }
    const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
    if (top !== undefined) byArea.set(key, top[0])
  }

  const rest = usage
    .map(keyOf)
    .filter((k) => !byArea.has(k))
    .sort()
  const label = new Map(rest.map((k) => [k, k]))
  for (let round = 0; round < 10; round++) {
    let moved = false
    for (const key of rest) {
      const weight = new Map<string, number>()
      for (const [other, w] of neighbours.get(key) ?? []) {
        const l = label.get(other)
        if (l !== undefined) weight.set(l, (weight.get(l) ?? 0) + w)
      }
      const best = [...weight].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
      if (best !== undefined && best[0] !== label.get(key)) {
        label.set(key, best[0])
        moved = true
      }
    }
    if (!moved) break
  }
  const groupName = (leader: string) => {
    const members = rest.filter((k) => label.get(k) === leader)
    const top = members.sort(
      (a, b) =>
        (nodes.get(b) as TagUse).total - (nodes.get(a) as TagUse).total || a.localeCompare(b),
    )[0] as string
    return (nodes.get(top) as TagUse).name
  }
  const groupSize = new Map<string, number>()
  for (const k of rest)
    groupSize.set(label.get(k) as string, (groupSize.get(label.get(k) as string) ?? 0) + 1)
  const clusterOf = (key: string) => {
    const area = byArea.get(key)
    if (area !== undefined) return area
    const leader = label.get(key) as string
    return (groupSize.get(leader) ?? 0) < 2 ? 'Other' : groupName(leader)
  }

  const tags: TagNode[] = usage.map((u) => {
    const key = keyOf(u)
    return {
      ...u,
      cluster: clusterOf(key),
      often: [...(neighbours.get(key) ?? [])]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([other, count]) => ({ ...ref(other), count })),
    }
  })
  const counts = new Map<string, number>()
  for (const t of tags) counts.set(t.cluster, (counts.get(t.cluster) ?? 0) + 1)

  const duplicates: TagDuplicate[] = []
  const keys = usage.map(keyOf)
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const a = nodes.get(keys[i] as string) as TagUse
      const b = nodes.get(keys[j] as string) as TagUse
      const score = nameScore(a.name, b.name)
      if (score === 0) continue
      const shared = overlap(
        new Set([...(neighbours.get(keyOf(a))?.keys() ?? [])]),
        new Set([...(neighbours.get(keyOf(b))?.keys() ?? [])]),
      )
      if (score >= 0.85)
        duplicates.push({ a: ref(keyOf(a)), b: ref(keyOf(b)), reason: 'name', score })
      else if (shared >= 0.5)
        duplicates.push({
          a: ref(keyOf(a)),
          b: ref(keyOf(b)),
          reason: 'neighbours',
          score: Math.round((score + shared) * 50) / 100,
        })
    }
  duplicates.sort((x, y) => y.score - x.score || keyOf(x.a).localeCompare(keyOf(y.a)))

  return {
    tags,
    edges,
    clusters: [...counts]
      .map(([name, n]) => ({ name, tags: n }))
      .sort((a, b) => b.tags - a.tags || a.name.localeCompare(b.name)),
    duplicates,
  }
}

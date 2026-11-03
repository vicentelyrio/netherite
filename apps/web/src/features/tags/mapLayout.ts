export interface MapTag {
  readonly key: string
  readonly total: number
  readonly cluster: string
}

export interface Placed {
  readonly key: string
  readonly x: number
  readonly y: number
  readonly r: number
}

export interface MapLayout {
  readonly tags: ReadonlyArray<Placed>
  /** Where each cluster's name is written: above its tags. */
  readonly clusters: ReadonlyArray<{
    readonly name: string
    readonly x: number
    readonly y: number
  }>
  /** The box around everything, with room for the labels. */
  readonly bounds: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
}

/** A bubble's radius: the area follows how many items carry the tag. */
export const radiusOf = (total: number) => Math.min(54, 14 + 7 * Math.sqrt(Math.max(1, total)))

const GOLDEN = 2.399963229728653

/**
 * Bubbles grouped by cluster: clusters sit on a ring (one alone in the middle), and a cluster's
 * tags spiral outward from its centre, biggest first. The same tags always land in the same
 * places, so the map does not jump around when a tag is added.
 */
export const layoutMap = (tags: ReadonlyArray<MapTag>): MapLayout => {
  if (tags.length === 0)
    return { tags: [], clusters: [], bounds: { x: 0, y: 0, width: 400, height: 300 } }
  const groups = new Map<string, MapTag[]>()
  for (const t of tags) groups.set(t.cluster, [...(groups.get(t.cluster) ?? []), t])
  const ordered = [...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))

  const sizes = ordered.map(([, members]) => {
    const area = members.reduce((n, t) => n + radiusOf(t.total) ** 2 * 3.4, 0)
    return Math.sqrt(area)
  })
  // Cluster centres spiral outward from the middle, biggest first, so the picture fills the space.
  const spacing = (sizes.reduce((n, v) => n + v, 0) / sizes.length) * 1.85
  const placed: Array<{ key: string; x: number; y: number; r: number; cluster: string }> = []
  const labels: Array<{ name: string; x: number; y: number; top: number }> = []

  ordered.forEach(([name, members], index) => {
    const reach = index === 0 ? 0 : spacing * Math.sqrt(index)
    const cx = Math.cos(index * GOLDEN) * reach * 1.25
    const cy = Math.sin(index * GOLDEN) * reach
    const sorted = [...members].sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
    sorted.forEach((t, i) => {
      const r = radiusOf(t.total)
      const dist = i === 0 ? 0 : 34 * Math.sqrt(i) + r * 0.6
      placed.push({
        key: t.key,
        r,
        x: cx + Math.cos(i * GOLDEN) * dist,
        y: cy + Math.sin(i * GOLDEN) * dist,
        cluster: name,
      })
    })
    labels.push({ name, x: cx, y: cy, top: 0 })
  })

  // Push overlapping bubbles apart a few times.
  for (let pass = 0; pass < 60; pass++) {
    let moved = false
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i] as (typeof placed)[number]
        const b = placed[j] as (typeof placed)[number]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 0.01
        const gap = a.r + b.r + 6
        if (dist >= gap) continue
        const push = (gap - dist) / 2
        const ux = dx / dist
        const uy = dy / dist
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push
        moved = true
      }
    if (!moved) break
  }

  const minY = (name: string) =>
    Math.min(...placed.filter((p) => p.cluster === name).map((p) => p.y - p.r))
  // A name sits just above its tags; if a bubble of another cluster is in the way, it moves up.
  const clusters = labels.map((l) => {
    const mine = placed.filter((p) => p.cluster === l.name)
    const x = mine.reduce((n, p) => n + p.x, 0) / mine.length
    let y = minY(l.name) - 14
    const half = l.name.length * 5 + 6
    for (let tries = 0; tries < 8; tries++) {
      const blocked = placed.some(
        (p) =>
          p.cluster !== l.name &&
          p.x + p.r > x - half &&
          p.x - p.r < x + half &&
          p.y + p.r > y - 14 &&
          p.y - p.r < y + 4,
      )
      if (!blocked) break
      y -= 18
    }
    return { name: l.name, x, y }
  })
  const left = Math.min(...placed.map((p) => p.x - p.r)) - 30
  const right = Math.max(...placed.map((p) => p.x + p.r)) + 30
  const top = Math.min(...placed.map((p) => p.y - p.r), ...clusters.map((c) => c.y - 16)) - 20
  const bottom = Math.max(...placed.map((p) => p.y + p.r)) + 30
  return {
    tags: placed.map(({ cluster: _cluster, ...p }) => p),
    clusters,
    bounds: { x: left, y: top, width: right - left, height: bottom - top },
  }
}

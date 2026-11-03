import { describe, expect, test } from 'vitest'
import { layoutMap, radiusOf } from './mapLayout'

const tags = [
  { key: 'tags:a', total: 9, cluster: 'Product' },
  { key: 'tags:b', total: 4, cluster: 'Product' },
  { key: 'tags:c', total: 2, cluster: 'Product' },
  { key: 'tags:d', total: 5, cluster: 'Docs' },
  { key: 'tags:e', total: 1, cluster: 'Docs' },
]

describe('tag map layout', () => {
  test('bigger tags get bigger bubbles', () => {
    expect(radiusOf(9)).toBeGreaterThan(radiusOf(4))
    expect(radiusOf(400)).toBe(54)
  })

  test('every tag is placed once, and no two bubbles overlap', () => {
    const { tags: placed } = layoutMap(tags)
    expect(placed.map((p) => p.key).sort()).toEqual(tags.map((t) => t.key).sort())
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i] as (typeof placed)[number]
        const b = placed[j] as (typeof placed)[number]
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - 0.5)
      }
  })

  test('the same tags land in the same places', () => {
    expect(layoutMap(tags)).toEqual(layoutMap([...tags].reverse()))
  })

  test('each cluster has a label above its bubbles, and the bounds hold them all', () => {
    const map = layoutMap(tags)
    expect(map.clusters.map((c) => c.name).sort()).toEqual(['Docs', 'Product'])
    for (const p of map.tags) {
      expect(p.x - p.r).toBeGreaterThanOrEqual(map.bounds.x)
      expect(p.x + p.r).toBeLessThanOrEqual(map.bounds.x + map.bounds.width)
      expect(p.y + p.r).toBeLessThanOrEqual(map.bounds.y + map.bounds.height)
    }
    for (const c of map.clusters) expect(c.y).toBeGreaterThanOrEqual(map.bounds.y)
  })

  test('nothing to place gives an empty box', () => {
    expect(layoutMap([]).tags).toEqual([])
  })
})

import { Icon } from '@netherite/ui'
import { useMemo, useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { layoutMap } from '../mapLayout'
import { keyOf } from '../rules'
import { useTags } from '../TagsProvider'
import './TagsMap.css'

const palette = ['#8f91f2', '#3ba474', '#d9a646', '#d2a8f0', '#8fc3f2', '#f0b397', '#7ed6c8']

const ZOOM = { min: 0.5, max: 3, step: 1.25 }

/** Tags as bubbles, grouped by cluster: size is how many items, a line is how often two go together. */
export function TagsMap() {
  const { LL } = useI18nContext()
  const { shown, edges, duplicates, selected, select } = useTags()
  const [zoom, setZoom] = useState(1)
  const layout = useMemo(
    () => layoutMap(shown.map((t) => ({ key: keyOf(t), total: t.total, cluster: t.cluster }))),
    [shown],
  )
  const at = useMemo(() => new Map(layout.tags.map((p) => [p.key, p])), [layout])
  const colors = useMemo(() => {
    const names = [...new Set(shown.map((t) => t.cluster))].sort()
    return new Map(names.map((n, i) => [n, palette[i % palette.length] as string]))
  }, [shown])
  const peak = Math.max(1, ...edges.map((e) => e.count))
  const dupes = new Set(duplicates.map((d) => [keyOf(d.a), keyOf(d.b)].sort().join('|')))
  const { bounds } = layout
  const w = bounds.width / zoom
  const h = bounds.height / zoom
  const viewBox = `${bounds.x + (bounds.width - w) / 2} ${bounds.y + (bounds.height - h) / 2} ${w} ${h}`
  const selectedKey = selected === undefined ? undefined : keyOf(selected)
  const focus = selectedKey === undefined ? undefined : new Set([selectedKey])
  if (focus !== undefined)
    for (const e of edges) {
      if (e.a === selectedKey) focus.add(e.b)
      if (e.b === selectedKey) focus.add(e.a)
    }

  return (
    <div className="tm">
      {/* biome-ignore lint/a11y/useSemanticElements: an SVG cannot be a <fieldset> */}
      <svg
        viewBox={viewBox}
        role="group"
        aria-label={LL.tags.map.label()}
        className="tm-svg"
        onClick={() => select(undefined)}
        onKeyDown={(e) => e.key === 'Escape' && select(undefined)}
      >
        {edges.map((e) => {
          const a = at.get(e.a)
          const b = at.get(e.b)
          if (a === undefined || b === undefined) return null
          const dupe = dupes.has([e.a, e.b].sort().join('|'))
          const dim = focus !== undefined && !(focus.has(e.a) && focus.has(e.b))
          return (
            <line
              key={`${e.a}-${e.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="tm-edge"
              data-dupe={dupe || undefined}
              data-dim={dim || undefined}
              strokeWidth={1 + (e.count / peak) * 5}
              strokeDasharray={dupe ? '5 4' : undefined}
            />
          )
        })}
        {/* A likely duplicate is drawn even when the two never share an item. */}
        {duplicates.map((d) => {
          const a = at.get(keyOf(d.a))
          const b = at.get(keyOf(d.b))
          const key = [keyOf(d.a), keyOf(d.b)].sort().join('|')
          if (
            a === undefined ||
            b === undefined ||
            edges.some((e) => [e.a, e.b].sort().join('|') === key)
          )
            return null
          return (
            <line
              key={`d-${key}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="tm-edge"
              data-dupe
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          )
        })}
        {layout.clusters.map((c) => (
          <text key={c.name} x={c.x} y={c.y} className="tm-cluster" textAnchor="middle">
            {c.name}
          </text>
        ))}
        {shown.map((tag) => {
          const key = keyOf(tag)
          const p = at.get(key)
          if (p === undefined) return null
          const on = key === selectedKey
          const color = colors.get(tag.cluster) as string
          return (
            // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a <button>
            <g
              key={key}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={LL.tags.map.bubble({ name: tag.name, count: tag.total })}
              className="tm-bubble"
              data-dim={(focus !== undefined && !focus.has(key)) || undefined}
              onClick={(e) => {
                e.stopPropagation()
                select(on ? undefined : key)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  select(on ? undefined : key)
                }
              }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={color}
                fillOpacity={0.22}
                stroke={color}
                strokeWidth={on ? 3 : 1.5}
              />
              <text
                x={p.x}
                y={p.y}
                className="tm-name"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {tag.name}
              </text>
              <text
                x={p.x}
                y={p.y + 14}
                className="tm-count"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {tag.total}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="tm-zoom">
        <button
          type="button"
          aria-label={LL.tags.map.zoomIn()}
          onClick={() => setZoom((z) => Math.min(ZOOM.max, z * ZOOM.step))}
        >
          <Icon name="add" size="inline" />
        </button>
        <button
          type="button"
          aria-label={LL.tags.map.zoomOut()}
          onClick={() => setZoom((z) => Math.max(ZOOM.min, z / ZOOM.step))}
        >
          <Icon name="remove" size="inline" />
        </button>
        <button type="button" aria-label={LL.tags.map.fit()} onClick={() => setZoom(1)}>
          <Icon name="fit_screen" size="inline" />
        </button>
      </div>
    </div>
  )
}

import { Icon } from '@netherite/ui'
import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
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
  const [centre, setCentre] = useState<{ x: number; y: number } | undefined>(undefined)
  const [moved, setMoved] = useState<ReadonlyMap<string, { x: number; y: number }>>(new Map())
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<
    | { kind: 'pan'; client: { x: number; y: number }; centre: { x: number; y: number } }
    | { kind: 'node'; key: string; from: { x: number; y: number }; at: { x: number; y: number } }
    | undefined
  >(undefined)
  const dragged = useRef(false)
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
  const mid = centre ?? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const viewBox = `${mid.x - w / 2} ${mid.y - h / 2} ${w} ${h}`
  const place = (key: string) => {
    const p = at.get(key)
    const m = moved.get(key)
    return p === undefined ? undefined : m === undefined ? p : { ...p, ...m }
  }

  const toMap = (clientX: number, clientY: number) => {
    const el = svg.current
    const matrix = el?.getScreenCTM?.()
    if (el === null || matrix === null || matrix === undefined) return { x: clientX, y: clientY }
    const point = el.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const mapped = point.matrixTransform(matrix.inverse())
    return { x: mapped.x, y: mapped.y }
  }
  const latest = useRef({ zoom, mid, toMap })
  latest.current = { zoom, mid, toMap }

  useEffect(() => {
    const el = svg.current
    if (el === null) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { zoom: k, mid: m, toMap: map } = latest.current
      const next = Math.min(ZOOM.max, Math.max(ZOOM.min, k * Math.exp(-e.deltaY * 0.0015)))
      if (next === k) return
      const p = map(e.clientX, e.clientY)
      setCentre({ x: p.x - ((p.x - m.x) * k) / next, y: p.y - ((p.y - m.y) * k) / next })
      setZoom(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const capture = (e: ReactPointerEvent) => {
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {}
  }
  const press = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || drag.current !== undefined) return
    dragged.current = false
    drag.current = { kind: 'pan', client: { x: e.clientX, y: e.clientY }, centre: mid }
    capture(e)
  }
  const pressBubble = (e: ReactPointerEvent<SVGGElement>, key: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const p = place(key)
    if (p === undefined) return
    dragged.current = false
    drag.current = { kind: 'node', key, from: toMap(e.clientX, e.clientY), at: { x: p.x, y: p.y } }
    capture(e)
  }
  const dragTo = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (d === undefined) return
    if (d.kind === 'pan') {
      const box = svg.current?.getBoundingClientRect()
      const dx = e.clientX - d.client.x
      const dy = e.clientY - d.client.y
      if (Math.abs(dx) + Math.abs(dy) > 3) dragged.current = true
      if (box === undefined || box.width === 0 || !dragged.current) return
      const perPixel = w / box.width
      setCentre({ x: d.centre.x - dx * perPixel, y: d.centre.y - dy * perPixel })
    } else {
      const now = toMap(e.clientX, e.clientY)
      const dx = now.x - d.from.x
      const dy = now.y - d.from.y
      if (Math.abs(dx) + Math.abs(dy) > 4 / zoom) dragged.current = true
      if (!dragged.current) return
      setMoved((m) => new Map(m).set(d.key, { x: d.at.x + dx, y: d.at.y + dy }))
    }
  }
  const release = () => {
    drag.current = undefined
  }
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
        ref={svg}
        viewBox={viewBox}
        role="group"
        aria-label={LL.tags.map.label()}
        className="tm-svg"
        data-dragging={drag.current !== undefined || undefined}
        onPointerDown={press}
        onPointerMove={dragTo}
        onPointerUp={release}
        onPointerCancel={release}
        onClick={() => {
          if (!dragged.current) select(undefined)
          dragged.current = false
        }}
        onKeyDown={(e) => e.key === 'Escape' && select(undefined)}
      >
        {edges.map((e) => {
          const a = place(e.a)
          const b = place(e.b)
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
        {duplicates.map((d) => {
          const a = place(keyOf(d.a))
          const b = place(keyOf(d.b))
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
          const p = place(key)
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
              onPointerDown={(e) => pressBubble(e, key)}
              onClick={(e) => {
                e.stopPropagation()
                if (!dragged.current) select(on ? undefined : key)
                dragged.current = false
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
        <button
          type="button"
          aria-label={LL.tags.map.fit()}
          onClick={() => {
            setZoom(1)
            setCentre(undefined)
          }}
        >
          <Icon name="fit_screen" size="inline" />
        </button>
      </div>
    </div>
  )
}

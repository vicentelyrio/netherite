import {
  designColor,
  type EdgeKind,
  edgeStyle,
  graphMetrics,
  Icon,
  type ItemTypeName,
  itemTypeNames,
  nodeSpec,
  typeLabels,
} from '@netherite/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fitTo,
  type GraphData,
  type Live,
  layout,
  live,
  neighbourhood,
  type Placed,
  subgraph,
  toGraphology,
} from './layout'
import { graphTarget } from './target'
import './GraphView.css'

const NODE_SCALE = 1.25

const edgeLabels: Record<string, string> = {
  belongs_to: 'Belongs to',
  implements: 'Implements',
  explains: 'Explains',
  supersedes: 'Supersedes',
  co_changes: 'Co-changes',
  depends_on: 'Depends on',
  related: 'Related',
  reference: 'Mentions',
}

const typePlurals: Record<string, string> = {
  goal: 'Goals',
  project: 'Projects',
  task: 'Tasks',
  adr: 'ADRs',
  doc: 'Docs',
  context: 'Contexts',
  runbook: 'Runbooks',
}

const styleOf = (kind: string) => edgeStyle[kind as EdgeKind] ?? edgeStyle.reference
const canvas = '#282A3F'

/** A node's shape at a diameter, as the design draws it (Graph.dc.html). */
function Shape({
  type,
  x,
  y,
  scale,
  hollow,
}: {
  readonly type: ItemTypeName
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly hollow?: boolean
}) {
  const spec = nodeSpec[type]
  const r = spec.radius * scale
  const d = r * 2
  const fill = designColor.type[type]
  switch (spec.shape) {
    case 'diamond': {
      const side = d * 0.78
      return (
        <rect
          x={x - side / 2}
          y={y - side / 2}
          width={side}
          height={side}
          rx={2}
          fill={hollow ? 'transparent' : fill}
          stroke={hollow ? fill : 'none'}
          strokeWidth={1.5}
          transform={`rotate(45 ${x} ${y})`}
        />
      )
    }
    case 'square': {
      const side = d * 0.86
      return (
        <rect x={x - side / 2} y={y - side / 2} width={side} height={side} rx={3} fill={fill} />
      )
    }
    case 'ring':
      return <circle cx={x} cy={y} r={r - 1} fill={`${fill}33`} stroke={fill} strokeWidth={2} />
    case 'bar':
      return (
        <rect
          x={x - d * 0.65}
          y={y - d * 0.35}
          width={d * 1.3}
          height={d * 0.7}
          rx={3}
          fill={fill}
        />
      )
    default:
      return <circle cx={x} cy={y} r={r} fill={fill} />
  }
}

/** A node's name on a dark pill, beside or under the node. */
function Label({
  node,
  x,
  y,
  anchor,
  size,
  weight,
  color,
}: {
  readonly node: Placed
  readonly x: number
  readonly y: number
  readonly anchor: 'start' | 'middle' | 'end'
  readonly size: number
  readonly weight: number
  readonly color: string
}) {
  const text = node.title.length > 30 ? `${node.title.slice(0, 29)}…` : node.title
  const width = text.length * size * 0.54 + 12
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'start' ? x : x - width
  return (
    <g className="gv-label" pointerEvents="none">
      <rect
        x={left}
        y={y}
        width={width}
        height={size + 4}
        rx={4}
        fill={designColor.graph.labelBg}
      />
      <text
        x={left + width / 2}
        y={y + size}
        textAnchor="middle"
        fontSize={size}
        fontWeight={weight}
        fill={color}
      >
        {text}
      </text>
    </g>
  )
}

export interface GraphViewProps {
  readonly data: GraphData
  /** Draw only these nodes and the edges between them. */
  readonly scope?: ReadonlySet<string> | undefined
  /** What a screen reader hears for the picture. */
  readonly label: string
  /** `embedded` sits inside a page: it pans and zooms, but has no hint, and small ones no buttons. */
  readonly variant?: 'full' | 'embedded'
  /** The node to start focused on. */
  readonly focus?: string | undefined
  /** `panel` has counts for every type and link kind; `row` is one line of types; `none` has no legend. */
  readonly legend?: 'panel' | 'row' | 'none'
  /** Whose names are written: the focus only, it and its neighbours, or everyone. */
  readonly labels?: 'focus' | 'neighbors' | 'all'
  /** How big the nodes are against the design's sizes. */
  readonly nodeScale?: number
  /** Space around the fitted picture. */
  readonly pad?: number
  readonly padBottom?: number
  /** Show the zoom buttons. By default the full view and wide embedded ones have them. */
  readonly zoomButtons?: boolean
}

/**
 * The graph (ADR-00014, Graph.dc.html): SVG over a force layout. Hovering or focusing a node dims
 * everything that is not next to it; the legend hides types and kinds of link; the full view zooms,
 * pans and fits.
 */
export function GraphView({
  data,
  scope,
  label,
  variant = 'full',
  focus: initialFocus,
  legend = 'panel',
  labels = 'neighbors',
  nodeScale = NODE_SCALE,
  pad = 60,
  padBottom,
  zoomButtons,
}: GraphViewProps) {
  const embedded = variant === 'embedded'
  const navigate = useNavigate()
  /** Opens a node's page: double-click or Enter. */
  const open = (id: string) => {
    const node = data.nodes.find((n) => n.id === id)
    if (node) void navigate(graphTarget(node, data) as never)
  }
  const wrap = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [box, setBox] = useState({ width: 1000, height: 700 })
  useEffect(() => {
    const el = wrap.current
    if (el === null || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setBox((b) =>
          Math.abs(b.width - width) < 1 && Math.abs(b.height - height) < 1 ? b : { width, height },
        )
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const shown = useMemo(() => subgraph(data, scope), [data, scope])
  const graph = useMemo(() => toGraphology(shown), [shown])
  const laid = useMemo(() => layout(shown), [shown])
  // Where nodes have been dragged to, and the ones that moved to make room.
  const [moved, setMoved] = useState<ReadonlyMap<string, { x: number; y: number }>>(new Map())
  const placed = useMemo(
    () => (moved.size === 0 ? laid : laid.map((p) => ({ ...p, ...(moved.get(p.id) ?? {}) }))),
    [laid, moved],
  )
  const at = useMemo(() => new Map(placed.map((p) => [p.id, p])), [placed])
  const parents = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of shown.edges)
      if (e.kind === 'belongs_to' && !map.has(e.from)) map.set(e.from, e.to)
    return map
  }, [shown])

  const [hiddenTypes, setHiddenTypes] = useState<ReadonlySet<string>>(new Set())
  // The design draws five kinds of link; the others start hidden and the legend turns them on.
  const [hiddenKinds, setHiddenKinds] = useState<ReadonlySet<string>>(
    () => new Set(data.edges.map((e) => e.kind).filter((k) => !styleOf(k).inDesign)),
  )
  const [focus, setFocus] = useState<string | undefined>(initialFocus)
  const [hover, setHover] = useState<Placed | undefined>()
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef<{ x: number; y: number; moved: boolean } | undefined>(undefined)
  const viewRef = useRef(view)
  viewRef.current = view
  const placedRef = useRef(placed)
  placedRef.current = placed
  const sim = useRef<Live | undefined>(undefined)
  const nodeDrag = useRef<{ id: string; x: number; y: number; moved: boolean } | undefined>(
    undefined,
  )
  const swallowClick = useRef(false)

  // A new layout (another graph, or items added) starts again from rest.
  useEffect(() => {
    sim.current?.stop()
    sim.current = undefined
    setMoved(new Map())
  }, [laid])
  useEffect(() => () => sim.current?.stop(), [])

  /** Picks a node up: it follows the pointer, and the nodes linked to it follow it. */
  const startNodeDrag = (id: string, e: React.PointerEvent) => {
    e.stopPropagation()
    if (e.button !== 0) return
    nodeDrag.current = { id, x: e.clientX, y: e.clientY, moved: false }
    const onMove = (m: PointerEvent) => {
      const d = nodeDrag.current
      const el = svg.current
      if (d === undefined || el === null) return
      if (!d.moved && Math.abs(m.clientX - d.x) + Math.abs(m.clientY - d.y) < 4) return
      if (!d.moved) {
        d.moved = true
        if (sim.current === undefined) {
          sim.current = live(shown, placedRef.current)
          sim.current.onTick((at) => setMoved(at))
        }
      }
      const rect = el.getBoundingClientRect()
      const v = viewRef.current
      sim.current?.hold(
        d.id,
        (m.clientX - rect.left - v.x) / v.k,
        (m.clientY - rect.top - v.y) / v.k,
      )
    }
    // Capture phase: a pointer-up on a node is stopped before it bubbles to the window, and the
    // drag must still end.
    const onUp = () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
      const d = nodeDrag.current
      nodeDrag.current = undefined
      if (d?.moved) {
        sim.current?.release(d.id)
        // The click that ends a drag is not a click on the node.
        swallowClick.current = true
        // If the pointer came up off the node there is no click to swallow.
        setTimeout(() => {
          swallowClick.current = false
        }, 0)
      }
    }
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
  }
  // Nodes and labels keep their pixel size at any zoom, as in the design: only positions scale.
  const sat = useMemo(
    () =>
      new Map(
        placed.map((p) => [p.id, { ...p, x: p.x * view.k + view.x, y: p.y * view.k + view.y }]),
      ),
    [placed, view],
  )

  const visible = placed.filter((p) => !hiddenTypes.has(p.type))
  const onScreen = visible.map((p) => sat.get(p.id) as Placed)
  const visibleIds = new Set(visible.map((p) => p.id))
  const edges = shown.edges.filter(
    (e) =>
      !hiddenKinds.has(e.kind) && visibleIds.has(e.from) && visibleIds.has(e.to) && e.from !== e.to,
  )
  const active = hover?.id ?? focus
  const near = active === undefined ? undefined : neighbourhood(graph, active)
  const focusNear = focus === undefined ? undefined : neighbourhood(graph, focus)
  const kindsPresent = [...new Set(shown.edges.map((e) => e.kind))].sort()
  const typesPresent = itemTypeNames.filter((t) => placed.some((p) => p.type === t))

  const fitPoints = (points: ReadonlyArray<Placed>) => {
    if (!embedded || initialFocus === undefined || !graph.hasNode(initialFocus)) return points
    const keep = new Set<string>()
    for (const id of neighbourhood(graph, initialFocus)) {
      for (const next of neighbourhood(graph, id)) keep.add(next)
    }
    const around = points.filter((p) => keep.has(p.id))
    return around.length > 1 ? around : points
  }
  const doFit = (points: ReadonlyArray<Placed>) =>
    fitTo(fitPoints(points), box, pad, padBottom ?? pad, embedded ? 3 : 2)
  // Fit again when what is drawn, or the room it has, changes.
  useEffect(() => setView(doFit(laid)), [laid, box])

  const zoom = (factor: number, cx = box.width / 2, cy = box.height / 2) =>
    setView((v) => {
      const k = Math.min(4, Math.max(0.2, v.k * factor))
      const ratio = k / v.k
      return { k, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio }
    })
  useEffect(() => {
    const el = svg.current
    if (el === null) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [embedded, box])

  const toggle = (set: ReadonlySet<string>, value: string) => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const radius = (p: Placed) => nodeSpec[p.type as ItemTypeName].radius * nodeScale
  const dim = (id: string) =>
    near !== undefined && !near.has(id) && !(focusNear?.has(id) && id === focus)
  const named = (p: Placed) =>
    labels === 'all' ||
    p.id === focus ||
    p.id === hover?.id ||
    (labels === 'neighbors' && (focusNear?.has(p.id) ?? false))
  const labelPlacement = (p: Placed) => {
    const r = radius(p)
    const parent = parents.get(p.id)
    const par = parent === undefined ? undefined : sat.get(parent)
    if (par !== undefined && p.type === 'task') {
      const angle = Math.atan2(p.y - par.y, p.x - par.x)
      const ux = Math.cos(angle)
      const uy = Math.sin(angle)
      if (ux > 0.38) return { x: p.x + r + 6, y: p.y - 10, anchor: 'start' as const }
      if (ux < -0.38) return { x: p.x - r - 6, y: p.y - 10, anchor: 'end' as const }
      if (uy < 0) return { x: p.x, y: p.y - r - 24, anchor: 'middle' as const }
    }
    return { x: p.x, y: p.y + r + 5, anchor: 'middle' as const }
  }

  const typeCount = (t: string) => shown.nodes.filter((n) => n.type === t).length
  const kindCount = (k: string) => shown.edges.filter((e) => e.kind === k).length
  const showTypeLegend = legend !== 'none'
  const focused = focus === undefined ? undefined : at.get(focus)

  return (
    <div ref={wrap} className={embedded ? 'gv gv--embedded' : 'gv'}>
      <svg
        ref={svg}
        className="gv-svg"
        viewBox={`0 0 ${box.width} ${box.height}`}
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (d === undefined) return
          const dx = e.clientX - d.x
          const dy = e.clientY - d.y
          if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
          if (d.moved) {
            drag.current = { x: e.clientX, y: e.clientY, moved: true }
            setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
          }
        }}
        onPointerUp={() => {
          const moved = drag.current?.moved
          drag.current = undefined
          // A click on the background, not the end of a pan, clears the focus.
          if (!moved) setFocus(undefined)
        }}
      >
        <defs>
          {[
            ['gv-arrow', '#7A7EA6'],
            ['gv-arrow-hot', '#B7B9FF'],
          ].map(([id, fill]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M0,1 L10,5 L0,9 z" fill={fill} />
            </marker>
          ))}
        </defs>
        <g>
          {edges.map((e) => {
            const a = sat.get(e.from)
            const b = sat.get(e.to)
            if (a === undefined || b === undefined) return null
            const s = styleOf(e.kind)
            const hot = active !== undefined && (e.from === active || e.to === active)
            const warm = !hot && focus !== undefined && (e.from === focus || e.to === focus)
            const typed = e.kind !== 'belongs_to' && e.kind !== 'reference'
            let x2 = b.x
            let y2 = b.y
            if (s.arrow) {
              const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
              const gap = radius(b) + graphMetrics.arrowGap
              x2 = b.x - ((b.x - a.x) / len) * gap
              y2 = b.y - ((b.y - a.y) / len) * gap
            }
            return (
              <line
                key={`${e.kind}:${e.from}>${e.to}`}
                data-kind={e.kind}
                x1={a.x}
                y1={a.y}
                x2={x2}
                y2={y2}
                stroke={
                  hot
                    ? designColor.accent.edgeActive
                    : warm
                      ? designColor.graph.edgeWarm
                      : typed
                        ? designColor.graph.edgeTyped
                        : designColor.graph.edge
                }
                strokeWidth={s.width + (hot ? graphMetrics.hotWidthBoost : 0)}
                strokeOpacity={
                  hot
                    ? graphMetrics.hotOpacity
                    : warm
                      ? graphMetrics.warmOpacity
                      : typed
                        ? 0.7
                        : 0.45
                }
                strokeDasharray={s.dash.length > 0 ? s.dash.join(' ') : undefined}
                strokeLinecap="round"
                markerEnd={s.arrow ? `url(#${hot ? 'gv-arrow-hot' : 'gv-arrow'})` : undefined}
              />
            )
          })}
          {onScreen.map((p) => {
            const type = p.type as ItemTypeName
            const color = designColor.type[type]
            const r = radius(p)
            return (
              // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a <button>
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-label={`${p.id} ${p.title}`}
                aria-pressed={focus === p.id}
                data-node={p.id}
                className="gv-node"
                opacity={dim(p.id) ? graphMetrics.dimmedOpacity : 1}
                onPointerDown={(e) => startNodeDrag(p.id, e)}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  if (swallowClick.current) {
                    swallowClick.current = false
                    return
                  }
                  setFocus(focus === p.id ? undefined : p.id)
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  open(p.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    open(p.id)
                  } else if (e.key === ' ') {
                    e.preventDefault()
                    setFocus(focus === p.id ? undefined : p.id)
                  }
                }}
                onPointerEnter={() => setHover(p)}
                onPointerLeave={() => setHover(undefined)}
                onFocus={() => setHover(p)}
                onBlur={() => setHover(undefined)}
              >
                {p.id === focus ? (
                  <>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r + 5}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      className="gv-glow"
                      style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r + 3.2}
                      fill="none"
                      stroke={canvas}
                      strokeWidth={2.4}
                    />
                  </>
                ) : (
                  p.id === hover?.id && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r + 3}
                      fill="none"
                      stroke="#E8E9F3"
                      strokeWidth={1.5}
                    />
                  )
                )}
                <Shape type={type} x={p.x} y={p.y} scale={nodeScale} />
              </g>
            )
          })}
          {onScreen.filter(named).map((p) => {
            const place = labelPlacement(p)
            const isFocus = p.id === focus
            const hot = isFocus || p.id === hover?.id
            return (
              <Label
                key={`l-${p.id}`}
                node={p}
                {...place}
                size={isFocus ? graphMetrics.labelSizeFocus : graphMetrics.labelSize}
                weight={isFocus ? 600 : 500}
                color={hot ? '#E8E9F3' : near?.has(p.id) ? '#B9BCD3' : '#8A8FAD'}
              />
            )
          })}
        </g>
      </svg>

      {hover !== undefined && sat.get(hover.id) !== undefined && (
        <div
          role="tooltip"
          className="gv-tooltip"
          style={{
            left: Math.min(Math.max(sat.get(hover.id)?.x ?? 0, 150), box.width - 150),
            top:
              (sat.get(hover.id)?.y ?? 0) - radius(hover) - 96 < 0
                ? (sat.get(hover.id)?.y ?? 0) + radius(hover) + 12
                : (sat.get(hover.id)?.y ?? 0) - radius(hover) - 88,
          }}
        >
          <div className="gv-tooltip-kind">
            <span style={{ background: designColor.type[hover.type as ItemTypeName] }} />
            {typeLabels[hover.type as ItemTypeName]}
            {parents.has(hover.id) && at.get(parents.get(hover.id) as string)
              ? ` · in ${at.get(parents.get(hover.id) as string)?.title}`
              : ''}
          </div>
          <div className="gv-tooltip-title">
            {hover.id} {hover.title}
          </div>
          <div className="gv-tooltip-meta">
            {graph.hasNode(hover.id) ? graph.degree(hover.id) : 0} links
          </div>
        </div>
      )}

      {showTypeLegend && legend === 'panel' && (
        <aside className="gv-legend" aria-label="Legend">
          <div>
            <h2 className="gv-legend-h">Nodes</h2>
            {typesPresent.map((t) => (
              <label key={t} className="gv-legend-row" data-off={hiddenTypes.has(t) || undefined}>
                <input
                  type="checkbox"
                  className="nt-visually-hidden"
                  checked={!hiddenTypes.has(t)}
                  onChange={() => setHiddenTypes(toggle(hiddenTypes, t))}
                />
                <span className="gv-glyph">
                  <svg width="14" height="14" aria-hidden="true">
                    <Shape type={t} x={7} y={7} scale={0.7} />
                  </svg>
                </span>
                <span className="gv-legend-name">{typePlurals[t]}</span>
                <span className="gv-count">{typeCount(t)}</span>
              </label>
            ))}
          </div>
          <div>
            <h2 className="gv-legend-h">Edges</h2>
            {kindsPresent.map((k) => {
              const style = styleOf(k)
              return (
                <label key={k} className="gv-legend-row" data-off={hiddenKinds.has(k) || undefined}>
                  <input
                    type="checkbox"
                    className="nt-visually-hidden"
                    checked={!hiddenKinds.has(k)}
                    onChange={() => setHiddenKinds(toggle(hiddenKinds, k))}
                  />
                  <svg width="24" height="8" aria-hidden="true">
                    <line
                      x1="1"
                      y1="4"
                      x2={style.arrow ? 17 : 23}
                      y2="4"
                      stroke={designColor.graph.sample}
                      strokeWidth={1.5}
                      strokeDasharray={style.dash.join(' ') || undefined}
                      strokeLinecap="round"
                    />
                    {style.arrow && (
                      <path d="M17,1 L23,4 L17,7 z" fill={designColor.graph.sample} />
                    )}
                  </svg>
                  <span className="gv-legend-name">{edgeLabels[k] ?? k}</span>
                  <span className="gv-count">{kindCount(k)}</span>
                </label>
              )
            })}
            <div className="gv-legend-row gv-legend-stale">
              <span className="gv-stale-dot" />
              <span className="gv-legend-name">Stale doc</span>
            </div>
          </div>
        </aside>
      )}
      {showTypeLegend && legend === 'row' && (
        <aside className="gv-legend gv-legend--row" aria-label="Legend">
          {typesPresent.map((t) => (
            <label key={t} data-off={hiddenTypes.has(t) || undefined}>
              <input
                type="checkbox"
                className="nt-visually-hidden"
                checked={!hiddenTypes.has(t)}
                onChange={() => setHiddenTypes(toggle(hiddenTypes, t))}
              />
              <span className="gv-glyph gv-glyph--small">
                <svg width="10" height="10" aria-hidden="true">
                  <Shape type={t} x={5} y={5} scale={0.5} />
                </svg>
              </span>
              {typeLabels[t]}
            </label>
          ))}
        </aside>
      )}

      {!embedded && (
        <div className="gv-hint">
          <Icon name="mouse" /> Hover for details · click to focus · double-click or Enter to open
        </div>
      )}
      {/* Small embedded graphs (the project page) pan and zoom too, but have no room for buttons. */}
      {(zoomButtons ?? (!embedded || box.width > 500)) && (
        <div className="gv-controls" role="toolbar" aria-label="Zoom">
          <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => zoom(1.3)}>
            <Icon name="add" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => zoom(1 / 1.3)}
          >
            <Icon name="remove" />
          </button>
          <span className="gv-controls-rule" />
          <button
            type="button"
            aria-label="Fit to view"
            title="Fit to screen"
            onClick={() => setView(doFit(visible))}
          >
            <Icon name="fit_screen" />
          </button>
        </div>
      )}
      {!embedded && focused !== undefined && (
        <div className="gv-focus" role="status">
          <strong>{focused.id}</strong> {focused.title}{' '}
          <Link to="/items/$id" params={{ id: focused.id }}>
            Open
          </Link>{' '}
          <button type="button" onClick={() => setFocus(undefined)}>
            Clear focus
          </button>
        </div>
      )}
    </div>
  )
}

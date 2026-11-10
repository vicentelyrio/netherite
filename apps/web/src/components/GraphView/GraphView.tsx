import {
  designColor,
  graphMetrics,
  Icon,
  type ItemTypeName,
  itemTypeNames,
  nodeSpec,
  statusGlyph,
} from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { useActionShortcuts } from '@/infrastructure/shortcuts'
import { GraphArrows } from './GraphArrows'
import { GraphControls } from './GraphControls'
import { GraphEdge } from './GraphEdge'
import { GraphFocus } from './GraphFocus'
import { GraphNode } from './GraphNode'
import { GraphTooltip } from './GraphTooltip'
import {
  buttonFactor,
  fitScale,
  nodeScaleDefault,
  padDefault,
  panSlop,
  statusNames,
  wheelFactor,
  zoomLimits,
} from './GraphView.constants'
import type { GraphViewProps, NodeStatus, StatusFilter } from './GraphView.types'
import { LegendMini } from './LegendMini'
import { LegendPanel } from './LegendPanel'
import { LegendRow } from './LegendRow'
import { labelPlacement } from './labelPlacement'
import { fitTo, layout, neighbourhood, type Placed, subgraph, toGraphology } from './layout'
import { NodeLabel } from './NodeLabel'
import { styleOf } from './styleOf'
import { graphTarget } from './target'
import { toggled } from './toggled'
import { useBox } from './useBox'
import { useLegendMin } from './useLegendMin'
import { useNodeDrag } from './useNodeDrag'
import './GraphView.css'

export function GraphView({
  data,
  scope,
  label,
  variant = 'full',
  focus: initialFocus,
  legend = 'panel',
  labels = 'neighbors',
  nodeScale = nodeScaleDefault,
  pad = padDefault,
  padBottom,
  zoomButtons,
  shortcuts,
  glow,
  className,
  legendClassName,
}: GraphViewProps) {
  const { LL } = useI18nContext()
  const embedded = variant === 'embedded'
  const navigate = useNavigate()
  const open = (id: string) => {
    const node = data.nodes.find((n) => n.id === id)
    if (node) void navigate(graphTarget(node, data) as never)
  }
  const wrap = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const box = useBox(wrap)

  const shown = useMemo(() => subgraph(data, scope), [data, scope])
  const graph = useMemo(() => toGraphology(shown), [shown])
  const laid = useMemo(() => layout(shown), [shown])
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const { placed, startNodeDrag, consumeClick } = useNodeDrag(shown, laid, svg, view)
  const at = useMemo(() => new Map(placed.map((p) => [p.id, p])), [placed])
  const parents = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of shown.edges)
      if (e.kind === 'belongs_to' && !map.has(e.from)) map.set(e.from, e.to)
    return map
  }, [shown])

  const [legendMin, setLegendMin] = useLegendMin()
  const [hiddenTypes, setHiddenTypes] = useState<ReadonlySet<string>>(new Set())
  const [hiddenKinds, setHiddenKinds] = useState<ReadonlySet<string>>(
    () => new Set(data.edges.map((e) => e.kind).filter((k) => !styleOf(k).inDesign)),
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [focus, setFocus] = useState<string | undefined>(initialFocus)
  const [hover, setHover] = useState<Placed | undefined>()
  const drag = useRef<{ x: number; y: number; moved: boolean } | undefined>(undefined)

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
  const statusesPresent = statusNames.filter((st) => placed.some((p) => p.status === st))
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
    fitTo(
      fitPoints(points),
      box,
      pad,
      padBottom ?? pad,
      embedded ? fitScale.embedded : fitScale.full,
    )
  useEffect(() => setView(doFit(laid)), [laid, box])

  const zoom = (factor: number, cx = box.width / 2, cy = box.height / 2) =>
    setView((v) => {
      const k = Math.min(zoomLimits.max, Math.max(zoomLimits.min, v.k * factor))
      const ratio = k / v.k
      return { k, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio }
    })
  useActionShortcuts(
    {
      'graph.zoomIn': () => zoom(buttonFactor),
      'graph.zoomOut': () => zoom(1 / buttonFactor),
      'graph.reset': () => setView(doFit(visible)),
    },
    { enabled: shortcuts === true },
  )
  useEffect(() => {
    const el = svg.current
    if (el === null) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoom(
        e.deltaY < 0 ? wheelFactor : 1 / wheelFactor,
        e.clientX - rect.left,
        e.clientY - rect.top,
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [embedded, box])

  const passes = (p: Placed) =>
    p.status === undefined ||
    statusFilter === 'all' ||
    (statusFilter === 'done' ? p.status === 'done' : p.status !== 'done')
  const radius = (p: Placed) => nodeSpec[p.type as ItemTypeName].radius * nodeScale
  const dim = (id: string) =>
    near !== undefined && !near.has(id) && !(focusNear?.has(id) && id === focus)
  const named = (p: Placed) =>
    labels === 'all' ||
    p.id === focus ||
    p.id === hover?.id ||
    (labels === 'neighbors' && (focusNear?.has(p.id) ?? false))
  const parentOnScreen = (p: Placed) => {
    const parent = parents.get(p.id)
    return parent === undefined ? undefined : sat.get(parent)
  }

  const statusCount = (st: NodeStatus) => shown.nodes.filter((n) => n.status === st).length
  const typeCount = (t: string) => shown.nodes.filter((n) => n.type === t).length
  const kindCount = (k: string) => shown.edges.filter((e) => e.kind === k).length
  const focused = focus === undefined ? undefined : at.get(focus)
  const hoverScreen = hover === undefined ? undefined : sat.get(hover.id)
  const hoverParent = hover === undefined ? undefined : parents.get(hover.id)

  return (
    <div
      ref={wrap}
      className={['gv', embedded ? 'gv--embedded' : '', className ?? ''].filter(Boolean).join(' ')}
    >
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
          if (Math.abs(dx) + Math.abs(dy) > panSlop) d.moved = true
          if (d.moved) {
            drag.current = { x: e.clientX, y: e.clientY, moved: true }
            setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
          }
        }}
        onPointerUp={() => {
          const moved = drag.current?.moved
          drag.current = undefined
          if (!moved) setFocus(undefined)
        }}
      >
        <GraphArrows />
        <g>
          {edges.map((e) => {
            const a = sat.get(e.from)
            const b = sat.get(e.to)
            if (a === undefined || b === undefined) return null
            const hot = active !== undefined && (e.from === active || e.to === active)
            return (
              <GraphEdge
                key={`${e.kind}:${e.from}>${e.to}`}
                kind={e.kind}
                a={a}
                b={b}
                hot={hot}
                warm={!hot && focus !== undefined && (e.from === focus || e.to === focus)}
                filtered={!passes(a) || !passes(b)}
                targetRadius={radius(b)}
              />
            )
          })}
          {onScreen.map((p) => (
            <GraphNode
              key={p.id}
              node={p}
              radius={radius(p)}
              scale={nodeScale}
              opacity={
                !passes(p)
                  ? statusGlyph.filteredOpacity
                  : dim(p.id)
                    ? graphMetrics.dimmedOpacity
                    : 1
              }
              focused={p.id === focus}
              hovered={p.id === hover?.id}
              glowing={glow?.has(p.id) === true}
              onDragStart={(e) => startNodeDrag(p.id, e)}
              onClick={() => {
                if (!consumeClick()) setFocus(focus === p.id ? undefined : p.id)
              }}
              onOpen={() => open(p.id)}
              onHover={(on) => setHover(on ? p : undefined)}
            />
          ))}
          {onScreen.filter(named).map((p) => {
            const isFocus = p.id === focus
            const hot = isFocus || p.id === hover?.id
            return (
              <NodeLabel
                key={`l-${p.id}`}
                node={p}
                {...labelPlacement(p, radius(p), parentOnScreen(p))}
                size={isFocus ? graphMetrics.labelSizeFocus : graphMetrics.labelSize}
                weight={isFocus ? 600 : 500}
                color={
                  hot
                    ? designColor.text.primary
                    : near?.has(p.id)
                      ? designColor.text.secondary
                      : designColor.text.lineNumber
                }
              />
            )
          })}
        </g>
      </svg>

      {hover !== undefined && hoverScreen !== undefined && (
        <GraphTooltip
          node={hover}
          screen={hoverScreen}
          radius={radius(hover)}
          width={box.width}
          parentTitle={hoverParent === undefined ? undefined : at.get(hoverParent)?.title}
          degree={graph.hasNode(hover.id) ? graph.degree(hover.id) : 0}
        />
      )}

      {legend === 'panel' && legendMin && (
        <LegendMini
          types={typesPresent}
          hidden={hiddenTypes}
          countOf={typeCount}
          onToggle={(t) => setHiddenTypes(toggled(hiddenTypes, t))}
          onExpand={() => setLegendMin(false)}
        />
      )}
      {legend === 'panel' && !legendMin && (
        <LegendPanel
          types={typesPresent}
          kinds={kindsPresent}
          statuses={statusesPresent}
          hiddenTypes={hiddenTypes}
          hiddenKinds={hiddenKinds}
          statusFilter={statusFilter}
          typeCount={typeCount}
          kindCount={kindCount}
          statusCount={statusCount}
          onToggleType={(t) => setHiddenTypes(toggled(hiddenTypes, t))}
          onToggleKind={(k) => setHiddenKinds(toggled(hiddenKinds, k))}
          onStatusFilter={setStatusFilter}
          onMinify={() => setLegendMin(true)}
        />
      )}
      {legend === 'row' && (
        <LegendRow
          types={typesPresent}
          hidden={hiddenTypes}
          onToggle={(t) => setHiddenTypes(toggled(hiddenTypes, t))}
          className={legendClassName}
        />
      )}

      {!embedded && (
        <div className="gv-hint">
          <Icon name="mouse" /> {LL.components.graph.hint()}
        </div>
      )}
      {(zoomButtons ?? (!embedded || box.width > 500)) && (
        <GraphControls
          onZoomIn={() => zoom(buttonFactor)}
          onZoomOut={() => zoom(1 / buttonFactor)}
          onFit={() => setView(doFit(visible))}
        />
      )}
      {!embedded && focused !== undefined && (
        <GraphFocus node={focused} onClear={() => setFocus(undefined)} />
      )}
    </div>
  )
}

import { useMemo } from 'react'
import { clusterLabel, useI18nContext } from '@/infrastructure/i18n'
import { layoutMap } from '../mapLayout'
import { keyOf } from '../rules'
import { useTags } from '../TagsProvider'
import { pairKey } from './pairKey'
import { TagBubble } from './TagBubble'
import { dupeDash, dupeWidth, edgeBase, edgeRange, palette } from './TagsMap.constants'
import { TagsMapZoom } from './TagsMapZoom'
import { useMapView } from './useMapView'
import './TagsMap.css'

export function TagsMap() {
  const { LL } = useI18nContext()
  const { shown, edges, duplicates, selected, select } = useTags()
  const layout = useMemo(
    () => layoutMap(shown.map((t) => ({ key: keyOf(t), total: t.total, cluster: t.cluster }))),
    [shown],
  )
  const at = useMemo(() => new Map(layout.tags.map((p) => [p.key, p])), [layout])
  const colors = useMemo(() => {
    const names = [...new Set(shown.map((t) => t.cluster))].sort()
    return new Map(names.map((n, i) => [n, palette[i % palette.length] as string]))
  }, [shown])
  const place = (key: string) => {
    const p = at.get(key)
    const m = view.moved.get(key)
    return p === undefined ? undefined : m === undefined ? p : { ...p, ...m }
  }
  const view = useMapView(layout.bounds, (key) => place(key))
  const peak = Math.max(1, ...edges.map((e) => e.count))
  const dupes = new Set(duplicates.map((d) => pairKey(keyOf(d.a), keyOf(d.b))))
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
        ref={view.svg}
        viewBox={view.viewBox}
        role="group"
        aria-label={LL.tags.map.label()}
        className="tm-svg"
        data-dragging={view.dragging || undefined}
        onPointerDown={view.press}
        onPointerMove={view.dragTo}
        onPointerUp={view.release}
        onPointerCancel={view.release}
        onClick={() => {
          if (!view.consumeDrag()) select(undefined)
        }}
        onKeyDown={(e) => e.key === 'Escape' && select(undefined)}
      >
        {edges.map((e) => {
          const a = place(e.a)
          const b = place(e.b)
          if (a === undefined || b === undefined) return null
          const dupe = dupes.has(pairKey(e.a, e.b))
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
              strokeWidth={edgeBase + (e.count / peak) * edgeRange}
              strokeDasharray={dupe ? dupeDash : undefined}
            />
          )
        })}
        {duplicates.map((d) => {
          const a = place(keyOf(d.a))
          const b = place(keyOf(d.b))
          const key = pairKey(keyOf(d.a), keyOf(d.b))
          if (a === undefined || b === undefined || edges.some((e) => pairKey(e.a, e.b) === key))
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
              strokeWidth={dupeWidth}
              strokeDasharray={dupeDash}
            />
          )
        })}
        {layout.clusters.map((c) => (
          <text key={c.name} x={c.x} y={c.y} className="tm-cluster" textAnchor="middle">
            {clusterLabel(LL, c.name)}
          </text>
        ))}
        {shown.map((tag) => {
          const key = keyOf(tag)
          const p = place(key)
          if (p === undefined) return null
          const on = key === selectedKey
          return (
            <TagBubble
              key={key}
              name={tag.name}
              total={tag.total}
              place={p}
              color={colors.get(tag.cluster) as string}
              on={on}
              dim={focus !== undefined && !focus.has(key)}
              onPress={(e) => view.pressBubble(e, key)}
              onToggle={(viaKeyboard) => {
                if (viaKeyboard || !view.consumeDrag()) select(on ? undefined : key)
              }}
            />
          )
        })}
      </svg>
      <TagsMapZoom onIn={view.zoomIn} onOut={view.zoomOut} onFit={view.fit} />
    </div>
  )
}

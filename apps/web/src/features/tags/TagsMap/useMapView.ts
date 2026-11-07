import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { nodeSlop, panSlop, wheelSpeed, zoomLimits } from './TagsMap.constants'

interface Point {
  readonly x: number
  readonly y: number
}

interface Bounds extends Point {
  readonly width: number
  readonly height: number
}

type Drag =
  | { kind: 'pan'; client: Point; centre: Point }
  | { kind: 'node'; key: string; from: Point; at: Point }
  | undefined

export const useMapView = (bounds: Bounds, positionOf: (key: string) => Point | undefined) => {
  const [zoom, setZoom] = useState(1)
  const [centre, setCentre] = useState<Point | undefined>(undefined)
  const [moved, setMoved] = useState<ReadonlyMap<string, Point>>(new Map())
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag>(undefined)
  const dragged = useRef(false)
  const w = bounds.width / zoom
  const h = bounds.height / zoom
  const mid = centre ?? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }

  const toMap = (clientX: number, clientY: number): Point => {
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
      const next = Math.min(
        zoomLimits.max,
        Math.max(zoomLimits.min, k * Math.exp(-e.deltaY * wheelSpeed)),
      )
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
    const p = positionOf(key)
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
      if (Math.abs(dx) + Math.abs(dy) > panSlop) dragged.current = true
      if (box === undefined || box.width === 0 || !dragged.current) return
      const perPixel = w / box.width
      setCentre({ x: d.centre.x - dx * perPixel, y: d.centre.y - dy * perPixel })
    } else {
      const now = toMap(e.clientX, e.clientY)
      const dx = now.x - d.from.x
      const dy = now.y - d.from.y
      if (Math.abs(dx) + Math.abs(dy) > nodeSlop / zoom) dragged.current = true
      if (!dragged.current) return
      setMoved((m) => new Map(m).set(d.key, { x: d.at.x + dx, y: d.at.y + dy }))
    }
  }
  const release = () => {
    drag.current = undefined
  }
  return {
    svg,
    moved,
    viewBox: `${mid.x - w / 2} ${mid.y - h / 2} ${w} ${h}`,
    dragging: drag.current !== undefined,
    consumeDrag: () => {
      const was = dragged.current
      dragged.current = false
      return was
    },
    press,
    pressBubble,
    dragTo,
    release,
    zoomIn: () => setZoom((z) => Math.min(zoomLimits.max, z * zoomLimits.step)),
    zoomOut: () => setZoom((z) => Math.max(zoomLimits.min, z / zoomLimits.step)),
    fit: () => {
      setZoom(1)
      setCentre(undefined)
    },
  }
}

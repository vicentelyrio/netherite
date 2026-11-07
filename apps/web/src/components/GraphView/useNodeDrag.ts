import { type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { nodeDragSlop } from './GraphView.constants'
import { type GraphData, type Live, live, type Placed } from './layout'

export const useNodeDrag = (
  shown: GraphData,
  laid: ReadonlyArray<Placed>,
  svg: RefObject<SVGSVGElement | null>,
  view: { readonly x: number; readonly y: number; readonly k: number },
) => {
  const [moved, setMoved] = useState<ReadonlyMap<string, { x: number; y: number }>>(new Map())
  const placed: ReadonlyArray<Placed> =
    moved.size === 0 ? laid : laid.map((p) => ({ ...p, ...(moved.get(p.id) ?? {}) }))
  const viewRef = useRef(view)
  viewRef.current = view
  const placedRef = useRef(placed)
  placedRef.current = placed
  const sim = useRef<Live | undefined>(undefined)
  const nodeDrag = useRef<{ id: string; x: number; y: number; moved: boolean } | undefined>(
    undefined,
  )
  const swallowClick = useRef(false)

  useEffect(() => {
    sim.current?.stop()
    sim.current = undefined
    setMoved(new Map())
  }, [laid])
  useEffect(() => () => sim.current?.stop(), [])

  const startNodeDrag = (id: string, e: PointerEvent) => {
    e.stopPropagation()
    if (e.button !== 0) return
    nodeDrag.current = { id, x: e.clientX, y: e.clientY, moved: false }
    const onMove = (m: globalThis.PointerEvent) => {
      const d = nodeDrag.current
      const el = svg.current
      if (d === undefined || el === null) return
      if (!d.moved && Math.abs(m.clientX - d.x) + Math.abs(m.clientY - d.y) < nodeDragSlop) return
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
    const onUp = () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
      const d = nodeDrag.current
      nodeDrag.current = undefined
      if (d?.moved) {
        sim.current?.release(d.id)
        swallowClick.current = true
        setTimeout(() => {
          swallowClick.current = false
        }, 0)
      }
    }
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
  }
  const consumeClick = () => {
    const was = swallowClick.current
    swallowClick.current = false
    return was
  }
  return { placed, startNodeDrag, consumeClick }
}

import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import './BoardTemplate.css'

export interface BoardTemplateProps {
  readonly side: ReactNode
  readonly main: ReactNode
  readonly mainRole?: 'tabpanel' | 'region'
  readonly mainLabel?: string
  readonly bleed?: boolean
  readonly overlay?: ReactNode
  readonly inset?: number | undefined
}

export function BoardTemplate({
  side,
  main,
  overlay,
  mainRole = 'tabpanel',
  mainLabel,
  bleed = false,
  inset,
}: BoardTemplateProps) {
  const frame = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const [clear, setClear] = useState(0)
  useLayoutEffect(() => {
    const root = frame.current
    const area = areaRef.current
    if (inset === undefined || root === null || area === null) {
      setClear(0)
      return
    }
    const measure = () => {
      const taken = area.getBoundingClientRect().left - root.getBoundingClientRect().left
      setClear(Math.max(0, inset + 24 - taken))
    }
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(root)
    return () => watch.disconnect()
  }, [inset])
  return (
    <div ref={frame} className="tpl-board">
      <aside className="tpl-board-side">{side}</aside>
      <div
        ref={areaRef}
        style={clear > 0 ? { paddingInlineStart: clear } : undefined}
        className={bleed ? 'tpl-board-main tpl-board-main--bleed' : 'tpl-board-main'}
        role={mainRole}
        {...(mainLabel ? { 'aria-label': mainLabel } : {})}
      >
        {main}
      </div>
      {overlay}
    </div>
  )
}

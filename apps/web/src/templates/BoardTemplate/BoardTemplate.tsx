import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import './BoardTemplate.css'

export interface BoardTemplateProps {
  /** Breadcrumb, title, view switch and a small graph: three columns. */
  readonly side: ReactNode
  /** The columns of cards: nine columns. */
  readonly main: ReactNode
  /** `tabpanel` when the side column holds the tabs (a project); `region` when it does not. */
  readonly mainRole?: 'tabpanel' | 'region'
  /** The accessible name of a `region` main area. */
  readonly mainLabel?: string
  /**
   * Let the main area run to the edges of the screen, without a scroll bar of its own. For a canvas
   * such as a graph that should fill the height.
   */
  readonly bleed?: boolean
  /** A drawer or other overlay, rendered after the board. */
  readonly overlay?: ReactNode
  /**
   * How wide a drawer open over the left of the page is. The main area keeps clear of it, so no
   * card sits underneath where it cannot be clicked.
   */
  readonly inset?: number | undefined
}

/** A project: a narrow side column and the board filling the rest. */
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

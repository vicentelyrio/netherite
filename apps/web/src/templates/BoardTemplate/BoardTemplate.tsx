import type { ReactNode } from 'react'
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
}

/** A project: a narrow side column and the board filling the rest. */
export function BoardTemplate({
  side,
  main,
  overlay,
  mainRole = 'tabpanel',
  mainLabel,
  bleed = false,
}: BoardTemplateProps) {
  return (
    <div className="tpl-board">
      <aside className="tpl-board-side">{side}</aside>
      <div
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

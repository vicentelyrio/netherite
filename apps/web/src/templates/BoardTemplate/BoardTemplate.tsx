import type { ReactNode } from 'react'
import './BoardTemplate.css'

export interface BoardTemplateProps {
  /** Breadcrumb, title, view switch and a small graph: three columns. */
  readonly side: ReactNode
  /** The columns of cards: nine columns. */
  readonly main: ReactNode
  /** A drawer or other overlay, rendered after the board. */
  readonly overlay?: ReactNode
}

/** A project: a narrow side column and the board filling the rest. */
export function BoardTemplate({ side, main, overlay }: BoardTemplateProps) {
  return (
    <div className="tpl-board">
      <aside className="tpl-board-side">{side}</aside>
      <div className="tpl-board-main" role="tabpanel">
        {main}
      </div>
      {overlay}
    </div>
  )
}

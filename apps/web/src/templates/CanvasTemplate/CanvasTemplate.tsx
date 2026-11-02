import type { ReactNode } from 'react'
import './CanvasTemplate.css'

export interface CanvasTemplateProps {
  /** The full-bleed canvas (graph, timeline). */
  readonly canvas: ReactNode
  /** Title block over the top left. */
  readonly header?: ReactNode
  /** Controls over the top right. */
  readonly controls?: ReactNode
  /** Panels over the bottom: legend, scrubber. */
  readonly footer?: ReactNode
}

/** A screen that is one canvas with panels floating over it. */
export function CanvasTemplate({ canvas, header, controls, footer }: CanvasTemplateProps) {
  return (
    <div className="tpl-canvas">
      <div className="tpl-canvas-fill">{canvas}</div>
      {header && <div className="tpl-canvas-header">{header}</div>}
      {controls && <div className="tpl-canvas-controls">{controls}</div>}
      {footer && <div className="tpl-canvas-footer">{footer}</div>}
    </div>
  )
}

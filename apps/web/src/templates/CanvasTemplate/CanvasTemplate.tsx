import type { ReactNode } from 'react'
import './CanvasTemplate.css'

export interface CanvasTemplateProps {
  readonly canvas: ReactNode
  readonly header?: ReactNode
  readonly controls?: ReactNode
  readonly footer?: ReactNode
}

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

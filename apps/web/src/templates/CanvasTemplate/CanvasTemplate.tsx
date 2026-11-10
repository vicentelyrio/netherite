import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
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
      <div className="tpl-canvas-fill" {...sectionProps(SectionName.Content)}>
        {canvas}
      </div>
      {header && (
        <div className="tpl-canvas-header" {...sectionProps(SectionName.Header)}>
          {header}
        </div>
      )}
      {controls && (
        <div className="tpl-canvas-controls" {...sectionProps(SectionName.Controls)}>
          {controls}
        </div>
      )}
      {footer && (
        <div className="tpl-canvas-footer" {...sectionProps(SectionName.Footer)}>
          {footer}
        </div>
      )}
    </div>
  )
}

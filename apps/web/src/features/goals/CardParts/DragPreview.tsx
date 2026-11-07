import { Card } from '@netherite/ui'
import type { ReactNode } from 'react'

export function DragPreview({ children }: { readonly children: ReactNode }) {
  return (
    <div className="goal-overlay">
      <Card className="goal-overlay-card">{children}</Card>
    </div>
  )
}

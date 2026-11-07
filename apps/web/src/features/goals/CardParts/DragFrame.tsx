import type { ReactNode } from 'react'
import { useReorderItem } from '@/components'

export function DragFrame({
  id,
  list,
  children,
}: {
  readonly id: string
  readonly list: string
  readonly children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, isDragging, edge } = useReorderItem(id, list, 'group')
  return (
    <div
      ref={setNodeRef}
      className="goal-draggable"
      data-dragging={isDragging || undefined}
      data-drop={edge}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

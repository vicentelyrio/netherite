import type { BoardCard } from '@netherite/api'
import { Card } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import type { MouseEvent } from 'react'
import { useReorderItem } from '@/components'
import { TaskCardBody } from './TaskCardBody'

export function TaskCard({
  card,
  projectId,
  category,
  selected,
  overline,
}: {
  readonly card: BoardCard
  readonly projectId: string
  readonly category: string
  readonly selected: boolean
  readonly overline?: string | undefined
}) {
  const { attributes, listeners, setNodeRef, isDragging, edge } = useReorderItem(
    card.id,
    card.state,
  )
  const navigate = useNavigate()
  const open = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a, button, input')) return
    void navigate({ to: '/projects/$id', params: { id: projectId }, search: { task: card.id } })
  }
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role="button" comes from the drag attributes
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard opens the task from the title link
    <div
      ref={setNodeRef}
      onClick={open}
      className="board-draggable"
      data-dragging={isDragging || undefined}
      data-drop={edge}
      data-category={category}
      data-selected={selected || undefined}
      {...attributes}
      {...listeners}
    >
      <Card interactive className="board-card-surface">
        <TaskCardBody card={card} projectId={projectId} overline={overline} category={category} />
      </Card>
    </div>
  )
}

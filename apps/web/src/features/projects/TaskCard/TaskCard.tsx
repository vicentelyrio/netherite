import { useDraggable } from '@dnd-kit/core'
import type { BoardCard } from '@netherite/api'
import { Avatar, Card, Icon, StatusGlyph, statusOfCategory } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { ProgressBar, TagList } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'

/** What a task card shows: where it is from, its title, labels, who has it and how far it is. */
export function TaskCardBody({
  card,
  projectId,
  overline,
  category,
}: {
  readonly card: BoardCard
  readonly projectId: string
  readonly overline?: string | undefined
  /** The state category of its column, which decides the glyph. */
  readonly category?: string | undefined
}) {
  const { LL } = useI18nContext()
  const assignee = card.assignees[0]
  return (
    <div className="board-card">
      {overline && <span className="board-overline">{overline}</span>}
      <div className="board-card-top">
        <StatusGlyph
          type="task"
          status={statusOfCategory[category as keyof typeof statusOfCategory] ?? 'backlog'}
          size={10}
        />
        <Link
          to="/projects/$id"
          params={{ id: projectId }}
          search={{ task: card.id }}
          className="board-card-title"
        >
          {card.title}
        </Link>
        {assignee !== undefined && <Avatar name={assignee} size={24} />}
      </div>
      <TagList tags={card.labels} />
      {card.waitingOn.length > 0 && (
        <div className="board-waiting">
          <Icon name="link" />{' '}
          {LL.projects.waitingOn({ names: card.waitingOn.map((d) => d.title).join(', ') })}
        </div>
      )}
      {card.checklist && <ProgressBar done={card.checklist.done} total={card.checklist.total} />}
    </div>
  )
}

/** A task card that can be picked up and dropped on another column. */
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })
  return (
    <div
      ref={setNodeRef}
      className="board-draggable"
      data-dragging={isDragging || undefined}
      data-category={category}
      data-selected={selected || undefined}
      {...attributes}
      {...listeners}
    >
      <Card interactive>
        <TaskCardBody card={card} projectId={projectId} overline={overline} category={category} />
      </Card>
    </div>
  )
}

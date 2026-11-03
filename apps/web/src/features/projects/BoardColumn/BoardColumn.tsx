import { useDroppable } from '@dnd-kit/core'
import type { BoardCard } from '@netherite/api'
import { type StateCategory, TaskStatePill } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { NewTask } from '../NewTask'
import { TaskCard } from '../TaskCard'

/** One state of the board: its tasks, a drop target, and a way to add a task in it. */
export function BoardColumn({
  name,
  category,
  cards,
  projectId,
  selected,
  overline,
  dragging,
}: {
  readonly projectId: string
  readonly name: string
  readonly category: string
  readonly cards: ReadonlyArray<BoardCard>
  readonly selected: string | undefined
  readonly overline?: string | undefined
  /** The task being dragged, if any. */
  readonly dragging: BoardCard | undefined
}) {
  const { LL } = useI18nContext()
  const { setNodeRef, isOver } = useDroppable({ id: name })
  const target = isOver && dragging !== undefined && dragging.state !== name
  return (
    <section
      ref={setNodeRef}
      className="board-column"
      data-over={target || undefined}
      aria-label={name}
    >
      <header className="board-column-head">
        <TaskStatePill state={name} category={category as StateCategory} />
        <span className="board-count">{cards.length}</span>
      </header>
      <div className="board-cards">
        {cards.map((card) => (
          <TaskCard
            key={card.id}
            card={card}
            projectId={projectId}
            category={category}
            selected={card.id === selected}
            overline={overline}
          />
        ))}
        {target && <div className="board-drop">{LL.projects.dropTo({ name })}</div>}
      </div>
      <NewTask projectId={projectId} state={name} />
    </section>
  )
}

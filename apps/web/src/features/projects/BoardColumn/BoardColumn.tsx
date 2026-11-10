import type { BoardCard } from '@netherite/api'
import { Icon, type StateCategory } from '@netherite/ui'
import { useReorderList } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { NewTask } from '../NewTask'
import { TaskCard } from '../TaskCard'

const categoryIcon: Readonly<Record<StateCategory, string>> = {
  todo: 'radio_button_unchecked',
  active: 'clock_loader_40',
  blocked: 'pause_circle',
  done: 'check_circle',
}

export function BoardColumn({
  name,
  category,
  cards,
  projectId,
  selected,
  overline,
  dragging,
  first,
}: {
  readonly projectId: string
  readonly name: string
  readonly category: string
  readonly cards: ReadonlyArray<BoardCard>
  readonly selected: string | undefined
  readonly overline?: string | undefined
  readonly dragging: BoardCard | undefined
  readonly first: boolean
}) {
  const { LL } = useI18nContext()
  const list = useReorderList(name)
  const target = list.over && dragging !== undefined && dragging.state !== name
  return (
    <section
      ref={list.setNodeRef}
      className="board-column"
      data-over={target || undefined}
      aria-label={name}
    >
      <header className="board-column-head">
        <span className="board-column-icon" data-category={category}>
          <Icon
            name={categoryIcon[category as StateCategory] ?? 'radio_button_unchecked'}
            size="inline"
            filled={category === 'done'}
          />
        </span>
        <h2 className="board-column-name">{name}</h2>
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
        {target && list.blank && <div className="board-drop">{LL.projects.dropTo({ name })}</div>}
      </div>
      <NewTask projectId={projectId} state={name} first={first} />
    </section>
  )
}

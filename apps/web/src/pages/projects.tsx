import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Board, BoardCard } from '@netherite/api'
import { NotFound } from '@netherite/api'
import {
  Banner,
  Card,
  EmptyState,
  Icon,
  type ItemTypeName,
  Progress,
  type StateCategory,
  Tabs,
  TaskStatePill,
  TypeBadge,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useApi } from '../lib/app-context'
import { boardQuery, projectsQuery } from '../lib/queries'
import { useWrite } from '../lib/writes'
import { RadialGraph } from './radial-graph'

export function ProjectsPage() {
  const api = useApi()
  const query = useQuery(projectsQuery(api))
  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title="Could not load projects">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const { projects } = query.data
  return (
    <div className="app-page">
      <h1 className="app-title">Projects</h1>
      {projects.length === 0 && (
        <EmptyState
          icon="task_alt"
          title="No projects yet"
          description="A project groups tasks under one or more goals."
        />
      )}
      <div className="goals-columns">
        {projects.map((project) => {
          const progress = project.progress ?? { done: 0, total: 0 }
          return (
            <Link
              key={project.id}
              to="/projects/$id"
              params={{ id: project.id }}
              className="app-row-link"
            >
              <Card interactive>
                <div className="goal-card">
                  <div className="goal-card-title">{project.title}</div>
                  <Progress done={progress.done} total={progress.total} />
                  <code className="app-id">{project.id}</code>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function CardBody({ card }: { readonly card: BoardCard }) {
  return (
    <div className="board-card">
      <Link to="/items/$id" params={{ id: card.id }} className="board-card-title">
        {card.title}
      </Link>
      {card.labels.length > 0 && (
        <div className="goal-tags">
          {card.labels.map((label) => (
            <span key={label} className="goal-tag">
              {label}
            </span>
          ))}
        </div>
      )}
      {card.checklist && <Progress done={card.checklist.done} total={card.checklist.total} />}
      {card.waitingOn.length > 0 && (
        <div className="board-waiting">
          <Icon name="hourglass_empty" /> Waiting on {card.waitingOn.map((d) => d.id).join(', ')}
        </div>
      )}
      <div className="board-card-foot">
        <code className="app-id">{card.id}</code>
        {card.assignees.map((a) => (
          <span key={a} className="app-muted">
            {a}
          </span>
        ))}
      </div>
    </div>
  )
}

function DraggableCard({ card }: { readonly card: BoardCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })
  return (
    <div
      ref={setNodeRef}
      className="board-draggable"
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
    >
      <Card interactive>
        <CardBody card={card} />
      </Card>
    </div>
  )
}

function Column({
  name,
  category,
  cards,
}: {
  readonly name: string
  readonly category: string
  readonly cards: ReadonlyArray<BoardCard>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: name })
  return (
    <section
      ref={setNodeRef}
      className="board-column"
      data-over={isOver || undefined}
      aria-label={name}
    >
      <header className="board-column-head">
        <TaskStatePill state={name} category={category as StateCategory} />
        <span className="goal-count">{cards.length}</span>
      </header>
      {cards.map((card) => (
        <DraggableCard key={card.id} card={card} />
      ))}
    </section>
  )
}

/** The state change a drop asks for, or `undefined` when it dropped outside or on its own column. */
export const moveFor = (
  tasks: ReadonlyArray<{ id: string; state: string }>,
  taskId: string,
  columnName: string | undefined,
) => {
  const task = tasks.find((t) => t.id === taskId)
  return task === undefined || columnName === undefined || task.state === columnName
    ? undefined
    : { id: taskId, state: columnName }
}

function TasksView({ board }: { readonly board: Board }) {
  const api = useApi()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const move = useWrite(api, (a, v: { id: string; state: string }) =>
    a.call((c) => c.items.setState({ params: { id: v.id }, payload: { state: v.state } })),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const change = moveFor(
      board.tasks,
      String(active.id),
      over === null ? undefined : String(over.id),
    )
    if (change !== undefined) move.mutate(change)
  }
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="board">
        {board.columns.map((column) => (
          <Column
            key={column.name}
            name={column.name}
            category={column.category}
            cards={board.tasks.filter((t) => t.state === column.name)}
          />
        ))}
      </div>
    </DndContext>
  )
}

function LinkedView({
  board,
  types,
  empty,
}: {
  readonly board: Board
  readonly types: ReadonlyArray<string>
  readonly empty: string
}) {
  const items = board.linked.filter((i) => types.includes(i.type))
  if (items.length === 0) return <p className="app-muted">{empty}</p>
  return (
    <section className="app-list">
      {items.map((item) => (
        <Link key={item.id} to="/items/$id" params={{ id: item.id }} className="app-row-link">
          <Card interactive>
            <div className="app-row">
              <TypeBadge type={item.type as ItemTypeName} />
              <code className="app-id">{item.id}</code>
              <span className="app-row-title">{item.title}</span>
            </div>
          </Card>
        </Link>
      ))}
    </section>
  )
}

export function BoardPage({ id }: { readonly id: string }) {
  const api = useApi()
  const query = useQuery(boardQuery(api, id))
  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <div className="app-page">
        <Banner
          variant={missing ? 'warning' : 'danger'}
          title={missing ? `No project ${id}` : 'Could not load this project'}
        >
          <Link to="/projects">Back to projects</Link>
        </Banner>
      </div>
    )
  }
  const board = query.data
  const progress = board.progress ?? { done: 0, total: 0 }
  return (
    <div className="app-page">
      <nav className="goal-crumbs" aria-label="Breadcrumb">
        <Link to="/projects">Projects</Link>
        <span> / {board.title}</span>
      </nav>
      <h1 className="app-title">{board.title}</h1>
      <div className="board-summary">
        <Progress done={progress.done} total={progress.total} />
        {board.goals.map((g) => (
          <Link key={g.id} to="/goals/$id" params={{ id: g.id }} className="goal-tag">
            {g.title}
          </Link>
        ))}
      </div>
      <Tabs defaultValue="tasks">
        <Tabs.List>
          <Tabs.Tab value="tasks">Tasks</Tabs.Tab>
          <Tabs.Tab value="docs">Docs</Tabs.Tab>
          <Tabs.Tab value="knowledge">Knowledge</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="tasks" pt="md">
          <div className="board-with-graph">
            <TasksView board={board} />
            <RadialGraph
              label={`${board.title}: tasks`}
              root={{ id: board.id, type: 'project', title: board.title }}
              branches={board.tasks.map((t) => ({
                id: t.id,
                type: 'task' as ItemTypeName,
                title: t.title,
                leaves: [],
              }))}
            />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="docs" pt="md">
          <LinkedView
            board={board}
            types={['doc', 'runbook']}
            empty="No docs or runbooks link to this project."
          />
        </Tabs.Panel>
        <Tabs.Panel value="knowledge" pt="md">
          <LinkedView
            board={board}
            types={['adr', 'context']}
            empty="No decisions or context link to this project."
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

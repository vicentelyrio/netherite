import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
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
  Avatar,
  Banner,
  Card,
  Icon,
  type ItemTypeName,
  type StateCategory,
  TaskStatePill,
  TypeBadge,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Breadcrumbs, ProgressBar, TagList, TitleForm } from '@/components'
import { GraphView } from '../graph/GraphView'
import { useApi } from '../lib/app-context'
import { boardQuery, graphQuery } from '../lib/queries'
import { useWrite } from '../lib/writes'
import { rememberProject } from './projects-entry'
import { TaskDrawer } from './task-drawer'

function CardBody({
  card,
  projectId,
  overline,
}: {
  readonly card: BoardCard
  readonly projectId: string
  readonly overline?: string | undefined
}) {
  const assignee = card.assignees[0]
  return (
    <div className="board-card">
      {overline && <span className="goal-overline">{overline}</span>}
      <div className="board-card-top">
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
          <Icon name="link" /> Waiting on {card.waitingOn.map((d) => d.title).join(', ')}
        </div>
      )}
      {card.checklist && <ProgressBar done={card.checklist.done} total={card.checklist.total} />}
    </div>
  )
}

function DraggableCard({
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
        <CardBody card={card} projectId={projectId} overline={overline} />
      </Card>
    </div>
  )
}

function NewTask({ projectId, state }: { readonly projectId: string; readonly state: string }) {
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const create = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({ payload: { type: 'task', title, fields: { project: projectId, state } } }),
    ),
  )
  return adding ? (
    <TitleForm
      label={`New ${state} task`}
      onCancel={() => setAdding(false)}
      onSubmit={(title) => create.mutate(title, { onSuccess: () => setAdding(false) })}
    />
  ) : (
    <button type="button" className="board-new" onClick={() => setAdding(true)}>
      <Icon name="add" /> New task
    </button>
  )
}

function Column({
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
        <span className="goal-count">{cards.length}</span>
      </header>
      {cards.map((card) => (
        <DraggableCard
          key={card.id}
          card={card}
          projectId={projectId}
          category={category}
          selected={card.id === selected}
          overline={overline}
        />
      ))}
      {target && <div className="board-drop">Drop to move to {name}</div>}
      <NewTask projectId={projectId} state={name} />
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

function TasksView({
  board,
  selected,
}: {
  readonly board: Board
  readonly selected: string | undefined
}) {
  const api = useApi()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const [dragging, setDragging] = useState<BoardCard | undefined>()
  const move = useWrite(api, (a, v: { id: string; state: string }) =>
    a.call((c) => c.items.setState({ params: { id: v.id }, payload: { state: v.state } })),
  )
  const overline = board.goals[0]?.title.toLowerCase()
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(undefined)
    const change = moveFor(
      board.tasks,
      String(active.id),
      over === null ? undefined : String(over.id),
    )
    if (change !== undefined) move.mutate(change)
  }
  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setDragging(board.tasks.find((t) => t.id === active.id))}
      onDragCancel={() => setDragging(undefined)}
      onDragEnd={onDragEnd}
    >
      <div className="board">
        {board.columns.map((column) => (
          <Column
            key={column.name}
            name={column.name}
            category={column.category}
            projectId={board.id}
            selected={selected}
            overline={overline}
            dragging={dragging}
            cards={board.tasks.filter((t) => t.state === column.name)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="board-overlay">
            <Card>
              <CardBody card={dragging} projectId={board.id} overline={overline} />
            </Card>
          </div>
        )}
      </DragOverlay>
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

function ProjectGraph({ board }: { readonly board: Board }) {
  const api = useApi()
  const query = useQuery(graphQuery(api))
  return (
    <section className="project-graph" aria-label="Graph">
      <header className="project-graph-head">
        <h2 className="project-graph-title">Graph</h2>
        <Link to="/graph" search={{ focus: board.id }} aria-label="Open the graph">
          <Icon name="open_in_full" />
        </Link>
      </header>
      {query.data ? (
        <GraphView
          data={query.data}
          variant="embedded"
          legend="row"
          labels="focus"
          nodeScale={0.85}
          pad={20}
          padBottom={56}
          focus={board.id}
          label={`${board.title}: tasks`}
        />
      ) : (
        <p className="app-muted">Loading graph…</p>
      )}
    </section>
  )
}

const views = [
  { id: 'tasks', label: 'Tasks', icon: 'view_kanban' },
  { id: 'docs', label: 'Docs', icon: 'description' },
  { id: 'knowledge', label: 'Knowledge', icon: 'menu_book' },
] as const

export function BoardPage({
  id,
  task,
  mode,
}: {
  readonly id: string
  readonly task?: string | undefined
  readonly mode?: 'split'
}) {
  const api = useApi()
  const navigate = useNavigate()
  const query = useQuery(boardQuery(api, id))
  useEffect(() => rememberProject(id), [id])
  const [view, setView] = useState<(typeof views)[number]['id']>('tasks')
  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <div className="app-page app-page--wide">
        <Banner
          variant={missing ? 'warning' : 'danger'}
          title={missing ? `No project ${id}` : 'Could not load this project'}
        >
          <Link to="/goals">Back to goals</Link>
        </Banner>
      </div>
    )
  }
  const board = query.data
  const goal = board.goals[0]
  return (
    <div className="app-page app-page--wide project-page">
      <aside className="project-side">
        <Breadcrumbs>
          <Link to="/goals">Goals</Link>
          {goal && (
            <>
              <span> / </span>
              <Link to="/goals/$id" params={{ id: goal.id }}>
                {goal.title}
              </Link>
            </>
          )}
        </Breadcrumbs>
        <h1 className="app-title project-title">{board.title}</h1>
        <div className="project-views" role="tablist" aria-label="Views">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              aria-label={v.label}
              data-active={view === v.id || undefined}
              onClick={() => setView(v.id)}
            >
              <Icon name={v.icon} />
            </button>
          ))}
          <span className="app-muted">{views.find((v) => v.id === view)?.label}</span>
        </div>
        <ProjectGraph board={board} />
      </aside>
      <div className="project-main" role="tabpanel">
        {view === 'tasks' && <TasksView board={board} selected={task} />}
        {view === 'docs' && (
          <LinkedView
            board={board}
            types={['doc', 'runbook']}
            empty="No docs or runbooks link to this project."
          />
        )}
        {view === 'knowledge' && (
          <LinkedView
            board={board}
            types={['adr', 'context']}
            empty="No decisions or context link to this project."
          />
        )}
      </div>
      <TaskDrawer
        id={task}
        columns={board.columns}
        projectTitle={board.title}
        {...(mode ? { initial: 'code' as const } : {})}
        onClose={() => void navigate({ to: '/projects/$id', params: { id }, search: {} })}
      />
    </div>
  )
}

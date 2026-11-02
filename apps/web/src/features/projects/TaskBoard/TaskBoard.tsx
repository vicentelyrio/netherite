import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Board, BoardCard } from '@netherite/api'
import { Card } from '@netherite/ui'
import { useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useWrite } from '@/infrastructure/query'
import { BoardColumn } from '../BoardColumn'
import { TaskCardBody } from '../TaskCard'
import './TaskBoard.css'

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

/** The project's tasks in a column per state; dropping a card in another column changes its state. */
export function TaskBoard({
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
          <BoardColumn
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
              <TaskCardBody card={dragging} projectId={board.id} overline={overline} />
            </Card>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

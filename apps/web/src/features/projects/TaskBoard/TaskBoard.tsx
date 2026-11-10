import { DragOverlay } from '@dnd-kit/core'
import type { Board, BoardCard } from '@netherite/api'
import { Card } from '@netherite/ui'
import { useState } from 'react'
import { type DropTarget, placeIn, ReorderContext } from '@/components'
import { TaskMover, useMoveTask } from '@/features/tasks'
import { useApi } from '@/infrastructure/api'
import { useWrite } from '@/infrastructure/query'
import { BoardColumn } from '../BoardColumn'
import { TaskCardBody } from '../TaskCard'
import { useBoardKeys } from './useBoardKeys'
import './TaskBoard.css'

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

export function TaskBoard({
  board,
  selected,
}: {
  readonly board: Board
  readonly selected: string | undefined
}) {
  const api = useApi()
  const [dragging, setDragging] = useState<BoardCard | undefined>()
  const move = useWrite(api, async (a, v: { id: string; state?: string; position?: number }) => {
    const { id, state, position } = v
    if (state !== undefined) {
      await a.call((c) => c.items.setState({ params: { id }, payload: { state } }))
    }
    if (position !== undefined) {
      await a.call((c) => c.items.update({ params: { id }, payload: { set: { position } } }))
    }
  })
  const keys = useBoardKeys(board, (id, state) => move.mutate({ id, state }))
  const mover = useMoveTask(keys.moving)
  const movingTask = board.tasks.find((t) => t.id === keys.moving)
  const overline = board.goals[0]?.title.toLowerCase()
  const onDrop = (id: string, target: DropTarget) => {
    const change = moveFor(board.tasks, id, target.list)
    if (change === undefined && target.item === undefined) return
    const cards = board.tasks.filter((t) => t.state === target.list)
    const position = placeIn(cards, id, target)
    if (change === undefined && position === undefined) return
    move.mutate({
      id,
      ...(change === undefined ? {} : { state: change.state }),
      ...(position === undefined ? {} : { position }),
    })
  }
  return (
    <ReorderContext
      onStart={(id) => setDragging(board.tasks.find((t) => t.id === id))}
      onEnd={() => setDragging(undefined)}
      onDrop={onDrop}
    >
      <div className="board" data-bleed>
        {board.columns.map((column, index) => (
          <BoardColumn
            key={column.name}
            name={column.name}
            first={index === 0}
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
            <Card className="board-overlay-card">
              <TaskCardBody
                card={dragging}
                projectId={board.id}
                overline={overline}
                category={board.columns.find((c) => c.name === dragging.state)?.category}
              />
            </Card>
          </div>
        )}
      </DragOverlay>
      {movingTask !== undefined && (
        <TaskMover
          task={movingTask}
          projectId={board.id}
          opened
          onClose={keys.stopMoving}
          onPick={(project) => {
            keys.stopMoving()
            mover.pick(project)
          }}
        />
      )}
    </ReorderContext>
  )
}

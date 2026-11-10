import type { Board } from '@netherite/api'
import { useEffect, useRef, useState } from 'react'
import { focusedItem, focusItem } from '@/infrastructure/sections'
import { useActionShortcuts } from '@/infrastructure/shortcuts'
import { type BoardColumns, cardBeside, cardInColumn, columnBeside, type Step } from './boardKeys'

export const useBoardKeys = (board: Board, moveToColumn: (id: string, state: string) => void) => {
  const [moving, setMoving] = useState<string | undefined>()
  const moved = useRef<string | undefined>(undefined)
  const columns: BoardColumns = board.columns.map((column) =>
    board.tasks.filter((t) => t.state === column.name).map((t) => t.id),
  )

  useEffect(() => {
    if (moved.current === undefined) return
    focusItem(moved.current)
    moved.current = undefined
  }, [board])

  const go = (pick: (id: string) => string | undefined) => () => {
    const id = focusedItem()
    if (id === undefined) return false
    const next = pick(id)
    if (next !== undefined) focusItem(next)
    return true
  }

  const shift = (step: Step) => () => {
    const id = focusedItem()
    const task = board.tasks.find((t) => t.id === id)
    if (task === undefined) return false
    const state = columnBeside(
      board.columns.map((c) => c.name),
      task.state,
      step,
    )
    if (state === undefined) return true
    moved.current = task.id
    moveToColumn(task.id, state)
    return true
  }

  useActionShortcuts({
    'board.down': go((id) => cardInColumn(columns, id, 1)),
    'board.up': go((id) => cardInColumn(columns, id, -1)),
    'board.left': go((id) => cardBeside(columns, id, -1)),
    'board.right': go((id) => cardBeside(columns, id, 1)),
    'board.moveLeft': shift(-1),
    'board.moveRight': shift(1),
    'board.move': () => {
      const id = focusedItem()
      if (id === undefined) return false
      setMoving(id)
      return true
    },
  })

  return { moving, stopMoving: () => setMoving(undefined) }
}

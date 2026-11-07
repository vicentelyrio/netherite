import { useEffect, useRef, useState } from 'react'
import {
  changesOf,
  moved,
  problemOf,
  type StateRow,
  sameStates,
  type TaskStateValue,
  toRows,
  toStates,
} from './statesDraft'

export const useStatesDraft = (states: ReadonlyArray<TaskStateValue>) => {
  const [rows, setRows] = useState(() => toRows(states))
  const nextKey = useRef(states.length)
  const base = useRef(states)

  useEffect(() => {
    setRows((current) =>
      sameStates(current, base.current) || sameStates(current, states) ? toRows(states) : current,
    )
    base.current = states
    nextKey.current = Math.max(nextKey.current, states.length)
  }, [states])

  const edit = (key: number, change: Partial<TaskStateValue>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)))

  return {
    rows,
    dirty: !sameStates(rows, states),
    problem: problemOf(rows),
    changes: changesOf(rows, states),
    values: toStates(rows),
    edit,
    add: (row: Omit<StateRow, 'key' | 'original'>) =>
      setRows((current) => [...current, { ...row, key: nextKey.current++, original: undefined }]),
    remove: (key: number) => setRows((current) => current.filter((row) => row.key !== key)),
    move: (from: number, to: number) => setRows((current) => moved(current, from, to)),
    discard: () => setRows(toRows(states)),
  }
}

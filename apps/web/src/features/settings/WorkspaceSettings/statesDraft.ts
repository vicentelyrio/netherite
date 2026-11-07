export interface TaskStateValue {
  readonly name: string
  readonly category: string
}

export interface StateRow extends TaskStateValue {
  readonly key: number
  readonly original: string | undefined
}

export const StateProblem = {
  Empty: 'empty',
  Duplicate: 'duplicate',
  None: 'none',
} as const

export type StateProblem = (typeof StateProblem)[keyof typeof StateProblem]

export const toRows = (states: ReadonlyArray<TaskStateValue>): ReadonlyArray<StateRow> =>
  states.map((state, key) => ({
    key,
    original: state.name,
    name: state.name,
    category: state.category,
  }))

export const toStates = (rows: ReadonlyArray<StateRow>): ReadonlyArray<TaskStateValue> =>
  rows.map((row) => ({ name: row.name.trim(), category: row.category }))

export const sameStates = (
  rows: ReadonlyArray<TaskStateValue>,
  states: ReadonlyArray<TaskStateValue>,
) =>
  rows.length === states.length &&
  rows.every(
    (row, i) => row.name.trim() === states[i]?.name && row.category === states[i]?.category,
  )

export const problemOf = (rows: ReadonlyArray<StateRow>): StateProblem | undefined => {
  const names = toStates(rows).map((state) => state.name)
  if (names.length === 0) return StateProblem.None
  if (names.includes('')) return StateProblem.Empty
  return new Set(names).size === names.length ? undefined : StateProblem.Duplicate
}

export interface StateChanges {
  readonly renamed: ReadonlyArray<{ readonly from: string; readonly to: string }>
  readonly removed: ReadonlyArray<string>
}

export const changesOf = (
  rows: ReadonlyArray<StateRow>,
  states: ReadonlyArray<TaskStateValue>,
): StateChanges => {
  const kept = new Set(rows.flatMap((row) => (row.original === undefined ? [] : [row.original])))
  const stillNamed = new Set(toStates(rows).map((state) => state.name))
  return {
    renamed: rows.flatMap((row) =>
      row.original === undefined || row.original === row.name.trim()
        ? []
        : [{ from: row.original, to: row.name.trim() }],
    ),
    removed: states
      .map((state) => state.name)
      .filter((name) => !kept.has(name) && !stillNamed.has(name)),
  }
}

export const hasChanges = ({ renamed, removed }: StateChanges) =>
  renamed.length > 0 || removed.length > 0

export const moved = <A>(list: ReadonlyArray<A>, from: number, to: number): ReadonlyArray<A> => {
  const next = [...list]
  const [item] = next.splice(from, 1)
  if (item !== undefined) next.splice(to, 0, item)
  return next
}

export type BoardColumns = ReadonlyArray<ReadonlyArray<string>>

export type Step = 1 | -1

const find = (columns: BoardColumns, id: string) => {
  const column = columns.findIndex((cards) => cards.includes(id))
  return { column, row: columns[column]?.indexOf(id) ?? -1 }
}

export const cardInColumn = (columns: BoardColumns, id: string, step: Step) => {
  const { column, row } = find(columns, id)
  return columns[column]?.[row + step]
}

export const cardBeside = (columns: BoardColumns, id: string, step: Step) => {
  const { column, row } = find(columns, id)
  for (let at = column + step; at >= 0 && at < columns.length; at += step) {
    const cards = columns[at] ?? []
    if (cards.length > 0) return cards[Math.min(row, cards.length - 1)]
  }
  return undefined
}

export const columnBeside = (names: ReadonlyArray<string>, current: string, step: Step) =>
  names[names.indexOf(current) + step]

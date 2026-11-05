/** Which lines of the text differ from the committed text. Line numbers are 1-based, in the new text. */
export interface LineChanges {
  /** Lines that are new. */
  readonly added: ReadonlySet<number>
  /** Lines that replace committed lines. */
  readonly modified: ReadonlySet<number>
  /** Lines after which committed lines were removed (0 means before the first line). */
  readonly deleted: ReadonlySet<number>
}

export const noChanges: LineChanges = { added: new Set(), modified: new Set(), deleted: new Set() }

type Op = 'same' | 'add' | 'remove'

/** Beyond this many table cells, an exact diff costs too much; a coarser one is used. */
const maxCells = 4_000_000

const align = (a: ReadonlyArray<string>, b: ReadonlyArray<string>): Op[] => {
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  const ops: Op[] = Array<Op>(start).fill('same')
  const x = a.slice(start, endA)
  const y = b.slice(start, endB)

  if (x.length * y.length > maxCells) {
    ops.push(...Array<Op>(x.length).fill('remove'), ...Array<Op>(y.length).fill('add'))
  } else {
    const w = y.length + 1
    const table = new Uint32Array((x.length + 1) * w)
    for (let i = x.length - 1; i >= 0; i--) {
      for (let j = y.length - 1; j >= 0; j--) {
        table[i * w + j] =
          x[i] === y[j]
            ? (table[(i + 1) * w + j + 1] ?? 0) + 1
            : Math.max(table[(i + 1) * w + j] ?? 0, table[i * w + j + 1] ?? 0)
      }
    }
    let i = 0
    let j = 0
    while (i < x.length || j < y.length) {
      if (i < x.length && j < y.length && x[i] === y[j]) {
        ops.push('same')
        i++
        j++
      } else if (
        i < x.length &&
        (j === y.length || (table[(i + 1) * w + j] ?? 0) >= (table[i * w + j + 1] ?? 0))
      ) {
        ops.push('remove')
        i++
      } else {
        ops.push('add')
        j++
      }
    }
  }
  ops.push(...Array<Op>(a.length - endA).fill('same'))
  return ops
}

/** The lines of a text. A newline at the end finishes the last line; it does not start another. */
const lines = (text: string) =>
  text === '' ? [] : (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n')

/**
 * Compares the text with the committed version, as an editor's change gutter shows it: lines that
 * are new, lines that replace committed ones, and places where committed lines were removed.
 */
export const diffLines = (committed: string, current: string): LineChanges => {
  const ops = align(lines(committed), lines(current))
  const added = new Set<number>()
  const modified = new Set<number>()
  const deleted = new Set<number>()

  let line = 0
  let i = 0
  while (i < ops.length) {
    if (ops[i] === 'same') {
      line++
      i++
      continue
    }
    let removed = 0
    let adds = 0
    while (i < ops.length && ops[i] !== 'same') {
      if (ops[i] === 'remove') removed++
      else adds++
      i++
    }
    const first = line + 1
    const paired = Math.min(removed, adds)
    for (let k = 0; k < adds; k++) (k < paired ? modified : added).add(first + k)
    if (adds === 0) deleted.add(line)
    line += adds
  }
  return { added, modified, deleted }
}

/** Does the text differ from the committed text at all? */
export const hasChanges = (c: LineChanges) => c.added.size + c.modified.size + c.deleted.size > 0

type Op = { kind: ' ' | '-' | '+'; text: string }

/**
 * Lines of a diff, from the longest common subsequence of the two texts' lines. Files here are
 * small (an item's Markdown), so the plain table is fast enough.
 */
const operations = (a: ReadonlyArray<string>, b: ReadonlyArray<string>): Op[] => {
  const width = b.length + 1
  const table = new Array<number>((a.length + 1) * width).fill(0)
  const at = (i: number, j: number) => table[i * width + j] ?? 0
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
    }
  }

  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    const left = a[i] as string
    const right = b[j] as string
    if (left === right) {
      ops.push({ kind: ' ', text: left })
      i++
      j++
    } else if (at(i + 1, j) >= at(i, j + 1)) {
      ops.push({ kind: '-', text: left })
      i++
    } else {
      ops.push({ kind: '+', text: right })
      j++
    }
  }
  for (; i < a.length; i++) ops.push({ kind: '-', text: a[i] as string })
  for (; j < b.length; j++) ops.push({ kind: '+', text: b[j] as string })
  return ops
}

const splitLines = (text: string) => {
  const lines = text.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines.map((line) => line.replace(/\r$/, ''))
}

/**
 * A unified diff of one file, with 3 lines of context. `null` stands for "no file", so a new
 * file diffs from `/dev/null` and a deleted one to it.
 */
export const unifiedDiff = (
  path: string,
  before: string | null,
  after: string | null,
  context = 3,
) => {
  const ops = operations(
    before === null ? [] : splitLines(before),
    after === null ? [] : splitLines(after),
  )
  const changed = ops.flatMap((op, index) => (op.kind === ' ' ? [] : [index]))
  const header = [
    `--- ${before === null ? '/dev/null' : `a/${path}`}`,
    `+++ ${after === null ? '/dev/null' : `b/${path}`}`,
  ]
  if (changed.length === 0) return [...header].join('\n')

  const hunks: Array<[number, number]> = []
  for (const index of changed) {
    const start = Math.max(0, index - context)
    const end = Math.min(ops.length, index + context + 1)
    const last = hunks.at(-1)
    if (last !== undefined && start <= last[1]) last[1] = end
    else hunks.push([start, end])
  }

  const out = [...header]
  for (const [start, end] of hunks) {
    const slice = ops.slice(start, end)
    const before_ = ops.slice(0, start).filter((o) => o.kind !== '+').length
    const after_ = ops.slice(0, start).filter((o) => o.kind !== '-').length
    const oldCount = slice.filter((o) => o.kind !== '+').length
    const newCount = slice.filter((o) => o.kind !== '-').length
    out.push(
      `@@ -${oldCount === 0 ? before_ : before_ + 1},${oldCount} +${newCount === 0 ? after_ : after_ + 1},${newCount} @@`,
    )
    for (const op of slice) out.push(`${op.kind}${op.text}`)
  }
  return out.join('\n')
}

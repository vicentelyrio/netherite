import { describe, expect, test } from 'vitest'
import { counts, placeProblems, type ServerDiagnostic } from '../src/editor/diagnostics'

const text = '---\nid: TASK-00001\nstate: nonsense\nrelated: \n---\n\nSee [[TASK-09999]] here.\n'
const d = (
  line: number,
  column: number,
  severity: ServerDiagnostic['severity'] = 'error',
  message = 'm',
): ServerDiagnostic => ({
  line,
  column,
  severity,
  message,
  rule: 'schema',
})

describe('putting the server’s problems into the text', () => {
  test('a problem is underlined from its column to the end of the word', () => {
    const [p] = placeProblems(text, [d(3, 1)])
    expect(text.slice(p?.from, p?.to)).toBe('state:')
    expect(p).toMatchObject({ line: 3, severity: 'error', message: 'm', rule: 'schema' })
  })

  test('a column in the middle of a line starts there', () => {
    const [p] = placeProblems(text, [d(7, 5)])
    expect(text.slice(p?.from, p?.to)).toBe('[[TASK-09999]]')
  })

  test('a problem at the end of a line is still one character wide, inside the line', () => {
    const [p] = placeProblems(text, [d(4, 10)])
    expect(p && p.to > p.from).toBe(true)
    expect(p && p.to <= text.indexOf('\n', p.from) + 1).toBe(true)
  })

  test('information is not shown in the editor', () => {
    expect(placeProblems(text, [d(1, 1, 'info')])).toEqual([])
  })

  test('problems outside the text are dropped, and the rest are in order', () => {
    const placed = placeProblems(text, [d(99, 1), d(7, 5, 'warning'), d(3, 1)])
    expect(placed.map((p) => p.line)).toEqual([3, 7])
  })

  test('a column past the end of the line is brought back onto the line', () => {
    const [p] = placeProblems('abc\ndef\n', [d(1, 50)])
    expect(p && p.from <= 3).toBe(true)
  })

  test('counts errors and warnings apart', () => {
    const placed = placeProblems(text, [d(3, 1), d(7, 5, 'warning'), d(2, 1)])
    expect(counts(placed)).toEqual({ errors: 2, warnings: 1 })
    expect(counts([])).toEqual({ errors: 0, warnings: 0 })
  })
})

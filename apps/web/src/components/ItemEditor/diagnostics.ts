/** A problem the server found in the text, as `POST /api/lint/text` reports it. */
export interface ServerDiagnostic {
  readonly line: number
  readonly column: number
  readonly rule: string
  readonly severity: 'error' | 'warning' | 'info'
  readonly message: string
}

/** A problem placed in the document: character offsets, and the line it starts on. */
export interface Problem {
  readonly from: number
  readonly to: number
  readonly line: number
  readonly severity: 'error' | 'warning'
  readonly message: string
  readonly rule: string
}

/** The text of a document, line by line, with where each line starts. */
const starts = (text: string) => {
  const result = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') result.push(i + 1)
  return result
}

/**
 * Puts the server's problems into the text. A problem has a line and a column; it is underlined
 * from there to the end of the word, so a key such as `related:` gets its whole name marked.
 * Information (an orphan, say) is not shown in the editor. Problems outside the text are dropped.
 */
export const placeProblems = (text: string, found: ReadonlyArray<ServerDiagnostic>): Problem[] => {
  const lineStarts = starts(text)
  const problems = found.flatMap((d): Problem[] => {
    if (d.severity === 'info') return []
    const start = lineStarts[d.line - 1]
    if (start === undefined) return []
    const lineEnd = (lineStarts[d.line] ?? text.length + 1) - 1
    const from = Math.min(start + Math.max(d.column - 1, 0), Math.max(lineEnd, start))
    const rest = text.slice(from, lineEnd)
    // A wikilink is marked whole; anything else to the end of the word.
    const word = /^\[\[[^\]\n]*\]\]/.exec(rest) ?? /^[^\s,\]}]+/.exec(rest)
    const to = Math.min(
      Math.max(from + (word?.[0].length ?? 1), from + 1),
      Math.max(lineEnd, from + 1),
    )
    return [{ from, to, line: d.line, severity: d.severity, message: d.message, rule: d.rule }]
  })
  return problems.sort((a, b) => a.from - b.from)
}

export const counts = (problems: ReadonlyArray<Problem>) => ({
  errors: problems.filter((p) => p.severity === 'error').length,
  warnings: problems.filter((p) => p.severity === 'warning').length,
})

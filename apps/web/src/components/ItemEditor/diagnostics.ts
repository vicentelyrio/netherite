export interface ServerDiagnostic {
  readonly line: number
  readonly column: number
  readonly rule: string
  readonly severity: 'error' | 'warning' | 'info'
  readonly message: string
}

export interface Problem {
  readonly from: number
  readonly to: number
  readonly line: number
  readonly severity: 'error' | 'warning'
  readonly message: string
  readonly rule: string
}

const starts = (text: string) => {
  const result = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') result.push(i + 1)
  return result
}

export const placeProblems = (text: string, found: ReadonlyArray<ServerDiagnostic>): Problem[] => {
  const lineStarts = starts(text)
  const problems = found.flatMap((d): Problem[] => {
    if (d.severity === 'info') return []
    const start = lineStarts[d.line - 1]
    if (start === undefined) return []
    const lineEnd = (lineStarts[d.line] ?? text.length + 1) - 1
    const from = Math.min(start + Math.max(d.column - 1, 0), Math.max(lineEnd, start))
    const rest = text.slice(from, lineEnd)
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

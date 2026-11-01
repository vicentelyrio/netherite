/** Where a command writes. The real one is stdout and stderr; tests collect into arrays. */
export interface Output {
  /** Normal output, one call per line (no trailing newline needed). */
  readonly line: (text: string) => void
  /** Problems and notes for the person, kept off stdout so `--json` stays clean. */
  readonly error: (text: string) => void
}

/** What a command reports back: 0 success, 1 findings or a rejected request, 2 could not run. */
export type ExitCode = 0 | 1 | 2

export const exitCodes = { ok: 0, findings: 1, usage: 2 } as const satisfies Record<
  string,
  ExitCode
>

export interface Env {
  readonly out: Output
  /** The folder the command was started from. */
  readonly cwd: string
}

export const json = (out: Output, value: unknown) => out.line(JSON.stringify(value, null, 2))

export interface Output {
  readonly line: (text: string) => void
  readonly error: (text: string) => void
}

export type ExitCode = 0 | 1 | 2

export const exitCodes = { ok: 0, findings: 1, usage: 2 } as const satisfies Record<
  string,
  ExitCode
>

export interface ServeEnv {
  readonly signal?: AbortSignal
  readonly open?: (url: string) => void
}

export interface Env {
  readonly out: Output
  readonly cwd: string
  readonly serve?: ServeEnv
  readonly stdio?: {
    readonly input?: import('node:stream').Readable
    readonly output?: import('node:stream').Writable
  }
}

export const json = (out: Output, value: unknown) => out.line(JSON.stringify(value, null, 2))

import type { Effect } from 'effect'
import type { Env, ExitCode } from '../output'

export interface CliContext {
  readonly env: Env
  readonly finish: (code: ExitCode) => Effect.Effect<void>
  readonly version: string
}

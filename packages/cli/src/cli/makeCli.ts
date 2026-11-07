import { Effect } from 'effect'
import { Command } from 'effect/cli'
import type { Env, ExitCode } from '../output'
import type { CliContext } from './cli.types'
import { defaultVersion } from './defaultVersion'
import { contextDefinition } from './definitions/context'
import { importDefinition } from './definitions/import'
import { initDefinition } from './definitions/init'
import { lintDefinition } from './definitions/lint'
import { mcpDefinition } from './definitions/mcp'
import { newDefinition } from './definitions/new'
import { renumberDefinition } from './definitions/renumber'
import { scanDefinition } from './definitions/scan'
import { serveDefinition } from './definitions/serve'
import { statsDefinition } from './definitions/stats'
import { templatesDefinition } from './definitions/templates'
import { timelineDefinition } from './definitions/timeline'

export const makeCli = (env: Env, state: { code: ExitCode }, version = defaultVersion) => {
  const ctx: CliContext = {
    env,
    version,
    finish: (code) =>
      Effect.sync(() => {
        state.code = code
      }),
  }
  const initCmd = initDefinition(ctx)
  const newCmd = newDefinition(ctx)
  const scanCmd = scanDefinition(ctx)
  const importCmd = importDefinition(ctx)
  const templatesCmd = templatesDefinition(ctx)
  const lintCmd = lintDefinition(ctx)
  const renumberCmd = renumberDefinition(ctx)
  const mcpCmd = mcpDefinition(ctx)
  const contextCmd = contextDefinition(ctx)
  const { serveFlags, serve, serveCmd } = serveDefinition(ctx)
  const timelineCmd = timelineDefinition(ctx)
  const statsCmd = statsDefinition(ctx)
  return Command.make('netherite', serveFlags, serve).pipe(
    Command.withDescription(
      'Typed, linked knowledge in your git repository. Documentation: https://vicentelyrio.github.io/netherite/',
    ),
    Command.withSubcommands([
      initCmd,
      newCmd,
      scanCmd,
      importCmd,
      templatesCmd,
      lintCmd,
      renumberCmd,
      mcpCmd,
      contextCmd,
      timelineCmd,
      statsCmd,
      serveCmd,
    ]),
  )
}

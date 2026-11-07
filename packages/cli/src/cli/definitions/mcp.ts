import { Effect } from 'effect'
import { Command, Flag } from 'effect/cli'
import { mcpCommand } from '../../commands/mcp'
import type { CliContext } from '../cli.types'
import { dir } from '../flags'

export const mcpDefinition = ({ env, finish, version }: CliContext) => {
  const mcpCmd = Command.make(
    'mcp',
    {
      dir,
      noWatch: Flag.Boolean('no-watch').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Do not watch for changes made outside the server.'),
      ),
    },
    (c) => Effect.flatMap(mcpCommand(env, { ...c, version }), finish),
  ).pipe(
    Command.withDescription(
      "Serve this workspace to an AI agent over MCP (stdio). Add it to your agent's MCP config.",
    ),
  )
  return mcpCmd
}

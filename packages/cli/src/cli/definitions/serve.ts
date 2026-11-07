import { Effect, Option } from 'effect'
import { Command, Flag } from 'effect/cli'
import { serveCommand } from '../../commands/serve'
import type { CliContext } from '../cli.types'
import { dir } from '../flags'

export const serveDefinition = ({ env, finish, version }: CliContext) => {
  const servePort = Flag.Int('port').pipe(
    Flag.optional,
    Flag.withDescription('Port to listen on (default 4747, or the next free one).'),
  )
  const serveFlags = {
    dir,
    port: servePort,
    noOpen: Flag.Boolean('no-open').pipe(
      Flag.withDefault(false),
      Flag.withDescription('Do not open the browser.'),
    ),
    app: Flag.String('app').pipe(
      Flag.optional,
      Flag.withDescription('Serve this built app folder instead of the bundled one.'),
    ),
    noWatch: Flag.Boolean('no-watch').pipe(
      Flag.withDefault(false),
      Flag.withDescription('Do not watch for changes made outside the server.'),
    ),
  }
  const serve = (c: {
    dir: string
    port: Option.Option<number>
    noOpen: boolean
    app: Option.Option<string>
    noWatch: boolean
  }) =>
    Effect.flatMap(
      serveCommand(env, {
        dir: c.dir,
        port: Option.getOrUndefined(c.port),
        noOpen: c.noOpen,
        app: Option.getOrUndefined(c.app),
        noWatch: c.noWatch,
        version,
      }),
      finish,
    )
  const serveCmd = Command.make('serve', serveFlags, serve).pipe(
    Command.withDescription(
      'Start the app, the API and MCP over HTTP on this machine (127.0.0.1 only). This is what `netherite` does with no command.',
    ),
  )
  return { serveFlags, serve, serveCmd }
}

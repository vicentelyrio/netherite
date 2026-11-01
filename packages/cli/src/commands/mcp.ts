import { gitHandle, openRepo, watchRepo, workspaceGit } from '@netherite/core'
import { createMcpServer, serveStdio } from '@netherite/mcp'
import { Effect, Path } from 'effect'
import { reportFailure } from '../errors'
import { type Env, type ExitCode, exitCodes } from '../output'

export interface McpCommandOptions {
  readonly dir: string
  /** Do not watch for changes made outside the server. */
  readonly noWatch: boolean
  readonly version: string
}

/**
 * Runs the MCP server on standard input and output, until the client disconnects. Standard
 * output carries only protocol messages, so everything meant for a person goes to standard error.
 */
export const mcpCommand = (env: Env, options: McpCommandOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    const run = Effect.scoped(
      Effect.gen(function* () {
        const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
        const git = yield* workspaceGit(repo.workspace)
        const createdBy = yield* gitHandle(git)
        const handle = yield* createMcpServer(repo, { git, createdBy, version: options.version })

        if (!options.noWatch) {
          const watcher = yield* Effect.result(watchRepo(repo))
          if (watcher._tag === 'Success') {
            watcher.success.listen(() => handle.invalidate())
          } else {
            env.out.error(`Not watching for outside changes: ${watcher.failure.message}`)
          }
        }
        env.out.error(`netherite mcp: serving ${repo.workspace.root} (${repo.index.size()} items)`)
        yield* serveStdio(handle, env.stdio)
        return exitCodes.ok as ExitCode
      }),
    )
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })

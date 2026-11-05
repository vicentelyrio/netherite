import { type ItemType, itemTypes, openWorkspace, readTemplates } from '@netherite/core'
import { Effect, Path } from 'effect'
import { reportFailure } from '../errors'
import { type Env, type ExitCode, exitCodes, json } from '../output'

export interface TemplatesOptions {
  readonly dir: string
  /** Print this type's template; without it, list every type and where its template comes from. */
  readonly type: string | undefined
  readonly json: boolean
}

/**
 * Lists the starter templates, or prints one to copy: the workspace's own file under
 * `templates/` in the content folder when there is one, else the one that ships.
 */
export const templatesCommand = (env: Env, options: TemplatesOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    if (
      options.type !== undefined &&
      !(itemTypes as ReadonlyArray<string>).includes(options.type)
    ) {
      env.out.error(`Unknown type "${options.type}". Use one of: ${itemTypes.join(', ')}`)
      return exitCodes.usage as ExitCode
    }
    const run = Effect.gen(function* () {
      const workspace = yield* openWorkspace(path.resolve(env.cwd, options.dir))
      const found = yield* readTemplates(workspace)

      if (options.type !== undefined) {
        const one = found.find((t) => t.type === (options.type as ItemType))
        if (one === undefined) return exitCodes.usage as ExitCode
        if (options.json) json(env.out, one)
        else env.out.line(one.text.replace(/\n$/, ''))
        return exitCodes.ok as ExitCode
      }
      if (options.json) {
        json(
          env.out,
          found.map(({ type, source, path: file }) => ({
            type,
            source,
            ...(file === undefined ? {} : { path: file }),
          })),
        )
      } else {
        for (const t of found) {
          env.out.line(`${t.type.padEnd(8)} ${t.source.padEnd(9)} ${t.path ?? ''}`.trimEnd())
        }
      }
      return exitCodes.ok as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })

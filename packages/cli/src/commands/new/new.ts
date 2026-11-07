import {
  createItem,
  gitHandle,
  type ItemType,
  itemTypes,
  openRepo,
  starterBody,
  workspaceGit,
} from '@netherite/core'
import { Effect, FileSystem, Path } from 'effect'
import { parse } from 'yaml'
import { reportFailure } from '../../errors'
import { type Env, type ExitCode, exitCodes, json } from '../../output'

export interface NewOptions {
  readonly dir: string
  readonly type: string
  readonly title: ReadonlyArray<string>
  readonly set: Readonly<Record<string, string>>
  readonly body: string | undefined
  readonly bodyFile: string | undefined
  readonly createdBy: string | undefined
  readonly template: boolean
  readonly json: boolean
}

const readValue = (text: string): unknown => {
  try {
    return parse(text)
  } catch {
    return text
  }
}

export const newItem = (env: Env, options: NewOptions) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    if (!(itemTypes as ReadonlyArray<string>).includes(options.type)) {
      env.out.error(`Unknown type "${options.type}". Use one of: ${itemTypes.join(', ')}`)
      return exitCodes.usage as ExitCode
    }
    const title = options.title.join(' ').trim()
    if (title === '') {
      env.out.error('A title is required.')
      return exitCodes.usage as ExitCode
    }
    if (options.body !== undefined && options.bodyFile !== undefined) {
      env.out.error('Use --body or --body-file, not both.')
      return exitCodes.usage as ExitCode
    }

    let body = options.body
    if (options.bodyFile !== undefined) {
      const file = path.resolve(env.cwd, options.bodyFile)
      const read = yield* Effect.result(fs.readFileString(file))
      if (read._tag === 'Failure') {
        env.out.error(`Cannot read ${options.bodyFile}: ${read.failure.message}`)
        return exitCodes.usage as ExitCode
      }
      body = read.success
    }

    const fields = Object.fromEntries(
      Object.entries(options.set).map(([k, v]) => [k, readValue(v)]),
    )

    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const createdBy = options.createdBy ?? (yield* gitHandle(yield* workspaceGit(repo.workspace)))
      let text = body
      if (options.template && text === undefined)
        text = yield* starterBody(repo.workspace, options.type as ItemType, title)
      const result = yield* createItem(repo, {
        type: options.type as ItemType,
        title,
        fields: fields as never,
        ...(text === undefined ? {} : { body: text }),
        ...(createdBy === undefined ? {} : { createdBy }),
      })
      if (options.json) json(env.out, { id: result.id, path: result.path, hash: result.hash })
      else env.out.line(`${result.id}  ${result.path}`)
      return exitCodes.ok as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })

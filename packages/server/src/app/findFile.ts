import { sep } from 'node:path'
import { Effect, FileSystem, Option, Path } from 'effect'
import { AppPath } from '../constants'

const isInside = (file: string, base: string) => file === base || file.startsWith(base + sep)

export const findFile = (base: string, pathname: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const wanted = pathname === AppPath.Root ? AppPath.Index : pathname
    const file = yield* fs.realPath(path.join(base, wanted)).pipe(Effect.option)
    if (Option.isNone(file) || !isInside(file.value, base)) return undefined
    const info = yield* fs.stat(file.value).pipe(Effect.option)
    return Option.isSome(info) && info.value.type === 'File' ? file.value : undefined
  })

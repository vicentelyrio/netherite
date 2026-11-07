import { extname, resolve } from 'node:path'
import { Effect, FileSystem, Option, Path } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { AppPath, HttpMethod, HttpStatus } from '../constants'
import type { ServerState } from '../state'
import { findFile } from './findFile'
import { binaryType, htmlType, mimeTypes } from './mimeTypes'
import { assetHeaders, pageHeaders } from './pageHeaders'
import { placeholderPage } from './placeholderPage'
import { isApiPath, requestPath } from './requestPath'
import { withSession } from './withSession'

const badRequest = () => HttpServerResponse.text('Bad request', { status: HttpStatus.BadRequest })
const notFound = () => HttpServerResponse.text('Not found', { status: HttpStatus.NotFound })

export const appRoutes = (state: ServerState, root: string | undefined) =>
  HttpRouter.add(
    HttpMethod.Get,
    AppPath.Everything,
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      const pathname = requestPath(request.url)
      if (pathname === undefined) return badRequest()
      if (isApiPath(pathname)) {
        return yield* HttpServerResponse.json(
          { _tag: 'NotFound', message: `No such endpoint: ${pathname}` },
          { status: HttpStatus.NotFound },
        )
      }

      const page = (html: string) =>
        HttpServerResponse.text(withSession(html, state), {
          contentType: htmlType,
          headers: pageHeaders,
        })

      if (root === undefined) return page(placeholderPage)
      const base = yield* fs.realPath(resolve(root)).pipe(Effect.option)
      if (Option.isNone(base)) return page(placeholderPage)

      const file = yield* findFile(base.value, pathname)
      if (file !== undefined) {
        const bytes = yield* fs.readFile(file).pipe(Effect.orDie)
        const type = mimeTypes[extname(file).toLowerCase()] ?? binaryType
        if (type === htmlType) return page(new TextDecoder().decode(bytes))
        return HttpServerResponse.uint8Array(bytes, {
          contentType: type,
          headers: assetHeaders(pathname.startsWith(AppPath.Assets)),
        })
      }

      if (extname(pathname) !== '') return notFound()
      const index = yield* fs
        .readFileString(path.join(base.value, AppPath.IndexFile))
        .pipe(Effect.option)
      return page(Option.getOrElse(index, () => placeholderPage))
    }),
  )

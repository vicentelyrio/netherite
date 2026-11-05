import { extname, resolve, sep } from 'node:path'
import { Effect, FileSystem, Path } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import type { ServerState } from './state'

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

/** Sent with every page: no framing, no outside scripts, connections only to this server. */
const pageHeaders = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'content-security-policy':
    "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
}

const escapeAttribute = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Puts the session into a page: the token the app sends with writes, and the server version.
 * Done on the server so the token never appears in a URL, where history and logs would keep it.
 */
export const withSession = (html: string, state: Pick<ServerState, 'token' | 'version'>) => {
  const tags = `<meta name="netherite-token" content="${escapeAttribute(state.token)}"><meta name="netherite-version" content="${escapeAttribute(state.version)}">`
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${tags}</head>`) : `${tags}${html}`
}

/** Shown until the app is built and bundled (TASK-00034, TASK-00049). */
export const placeholderPage = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Netherite</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem}code{background:#8882;padding:.1em .3em;border-radius:3px}</style>
</head>
<body>
<h1>Netherite is running</h1>
<p>The server is up and the API is ready, but this build has no app bundled yet.</p>
<ul><li><a href="/api/health">/api/health</a></li><li><a href="/api/openapi.json">/api/openapi.json</a></li></ul>
<p>Agents connect with <code>netherite mcp</code>.</p>
</body>
</html>
`

/**
 * Serves the built app from `root`: files as they are, and `index.html` (with the session in it)
 * for any path without a file extension, so client-side routes survive a reload. Paths cannot
 * climb out of `root`, not even through a symlink. Without a built app, a placeholder is served.
 */
export const appRoutes = (state: ServerState, root: string | undefined) =>
  HttpRouter.add(
    'GET',
    '/*',
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      let pathname: string
      try {
        pathname = decodeURIComponent(new URL(request.url, 'http://x').pathname)
      } catch {
        return HttpServerResponse.text('Bad request', { status: 400 })
      }
      if (
        pathname.includes('\0') ||
        pathname.includes('\\') ||
        pathname.split('/').includes('..')
      ) {
        return HttpServerResponse.text('Bad request', { status: 400 })
      }
      if (pathname === '/api' || pathname.startsWith('/api/')) {
        return yield* HttpServerResponse.json(
          { _tag: 'NotFound', message: `No such endpoint: ${pathname}` },
          { status: 404 },
        )
      }

      const page = (html: string) =>
        HttpServerResponse.text(withSession(html, state), {
          contentType: types['.html'] as string,
          headers: pageHeaders,
        })

      if (root === undefined) return page(placeholderPage)
      const base = yield* fs.realPath(resolve(root)).pipe(Effect.option)
      if (base._tag === 'None') return page(placeholderPage)

      const wanted = pathname === '/' ? '/index.html' : pathname
      const file = yield* fs.realPath(path.join(base.value, wanted)).pipe(Effect.option)
      const inside =
        file._tag === 'Some' &&
        (file.value === base.value || file.value.startsWith(base.value + sep))
      const info = inside ? yield* fs.stat(file.value).pipe(Effect.option) : undefined

      if (file._tag === 'Some' && inside && info?._tag === 'Some' && info.value.type === 'File') {
        const bytes = yield* fs.readFile(file.value).pipe(Effect.orDie)
        const type = types[extname(file.value).toLowerCase()] ?? 'application/octet-stream'
        if (type === types['.html']) return page(new TextDecoder().decode(bytes))
        return HttpServerResponse.uint8Array(bytes, {
          contentType: type,
          headers: {
            'x-content-type-options': 'nosniff',
            'cache-control': pathname.startsWith('/assets/')
              ? 'public, max-age=31536000, immutable'
              : 'no-cache',
          },
        })
      }

      if (extname(wanted) !== '') return HttpServerResponse.text('Not found', { status: 404 })
      const index = yield* fs
        .readFileString(path.join(base.value, 'index.html'))
        .pipe(Effect.option)
      return index._tag === 'Some' ? page(index.value) : page(placeholderPage)
    }),
  )

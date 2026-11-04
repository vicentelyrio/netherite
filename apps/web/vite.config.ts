import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** The running `netherite serve` that `vite dev` talks to. */
const server = process.env.NETHERITE_URL ?? 'http://127.0.0.1:4747'

/**
 * In development the page comes from Vite, not from Netherite, so it does not have the session
 * token. This asks the running server for its page and copies the token into Vite's.
 */
const sessionToken = (): Plugin => ({
  name: 'netherite-session-token',
  apply: 'serve',
  async transformIndexHtml(html) {
    try {
      const page = await (await fetch(`${server}/`)).text()
      const tags = page.match(/<meta name="netherite-(?:token|version)"[^>]*>/g) ?? []
      return html.replace('</head>', `${tags.join('')}</head>`)
    } catch {
      console.warn(`[netherite] no server at ${server}: start \`netherite serve --no-open\` first`)
      return html
    }
  },
})

/**
 * After a build, writes which modules went into which chunk and how big each is, for
 * `scripts/check-bundle.mjs` (the browser bundle may use only part of `effect`).
 */
const bundleReport = (): Plugin => ({
  name: 'netherite-bundle-report',
  apply: 'build',
  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).flatMap((item) =>
      item.type === 'chunk'
        ? [
            {
              file: item.fileName,
              modules: item.modules
                ? Object.fromEntries(
                    Object.entries(item.modules).map(([id, m]) => [id, m.renderedLength]),
                  )
                : {},
            },
          ]
        : [],
    )
    // Next to the app, not in `dist/`, which is what gets published.
    writeFileSync(
      fileURLToPath(new URL('./.bundle-report.json', import.meta.url)),
      JSON.stringify({ chunks }, null, 2),
    )
  },
})

export default defineConfig({
  plugins: [react(), sessionToken(), bundleReport()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: server,
        // The server only answers to its own address and origin (ADR-00010).
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (request) => request.removeHeader('origin'))
        },
      },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
})

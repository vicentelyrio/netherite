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

export default defineConfig({
  plugins: [react(), sessionToken()],
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

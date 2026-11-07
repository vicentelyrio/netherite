import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const server = process.env.NETHERITE_URL ?? 'http://127.0.0.1:4848'

const sessionToken = (): Plugin => ({
  name: 'netherite-session-token',
  apply: 'serve',
  async transformIndexHtml(html) {
    try {
      const page = await (await fetch(`${server}/`)).text()
      const tags = page.match(/<meta name="netherite-(?:token|version|workspace)"[^>]*>/g) ?? []
      return html.replace('</head>', `${tags.join('')}</head>`)
    } catch {
      console.warn(`[netherite] no server at ${server}: start \`pnpm dev:server\` first`)
      return html
    }
  },
})

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
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (request) => request.removeHeader('origin'))
        },
      },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
})

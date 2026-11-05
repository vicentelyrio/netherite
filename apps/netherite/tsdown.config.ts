import { defineLibrary } from '@netherite/config/tsdown'

/**
 * The one published package. The workspace packages (cli, server, mcp, core, ...) are bundled into
 * it, so a user installs `netherite` and nothing else of ours; their own dependencies are the
 * dependencies listed in package.json. The app is copied in by scripts/bundle-app.mjs.
 */
export default defineLibrary({
  entry: { bin: 'src/bin.ts', markdown: 'src/markdown.ts' },
  dts: false,
  banner: { js: '#!/usr/bin/env node' },
  deps: { alwaysBundle: [/^@netherite\//] },
})

import { defineLibrary } from '@netherite/config/tsdown'

export default defineLibrary({
  entry: { bin: 'src/bin.ts', markdown: 'src/markdown.ts' },
  dts: false,
  banner: { js: '#!/usr/bin/env node' },
  deps: { alwaysBundle: [/^@netherite\//] },
})

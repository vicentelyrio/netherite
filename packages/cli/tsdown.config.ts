import { defineLibrary } from '@netherite/config/tsdown'

export default defineLibrary({
  entry: { index: 'src/index.ts', bin: 'src/bin.ts' },
  banner: { js: '#!/usr/bin/env node' },
})

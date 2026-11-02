// Writes dist/tokens.css from the built package, so apps can `import '@netherite/tokens/tokens.css'`.
import { writeFileSync } from 'node:fs'
import { stylesheet } from '../dist/index.js'

writeFileSync(new URL('../dist/tokens.css', import.meta.url), stylesheet())

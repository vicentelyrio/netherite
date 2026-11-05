import { writeFileSync } from 'node:fs'
import { stylesheet } from '../dist/index.js'

writeFileSync(new URL('../dist/tokens.css', import.meta.url), stylesheet())

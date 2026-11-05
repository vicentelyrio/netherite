import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const effectPath = /node_modules\/\.pnpm\/effect@[^/]+\/node_modules\/effect\/dist\/(.+)$/

/** The modules of `effect` that went into the browser bundle, by path, with their rendered size. */
export const effectModulesOf = (report) => {
  const found = {}
  for (const chunk of report.chunks) {
    for (const [id, size] of Object.entries(chunk.modules)) {
      // A module can carry a query (`?commonjs-es-import`); it is still the same file.
      const match = effectPath.exec(id.split('?')[0])
      if (match) found[match[1]] = (found[match[1]] ?? 0) + size
    }
  }
  return found
}

/** The gzipped size of every script in the build together, which is what a first load costs. */
export const gzipBytesOf = (dist) => {
  const assets = join(dist, 'assets')
  return readdirSync(assets)
    .filter((f) => f.endsWith('.js'))
    .reduce((n, f) => n + gzipSync(readFileSync(join(assets, f)), { level: 9 }).length, 0)
}

/** How much a size may grow over the one on record before the check fails. */
export const slack = 1.05

/** What the build uses now, as the file of record keeps it. */
export const snapshot = (modules, gzip) => ({
  effect: {
    bytes: Object.values(modules).reduce((a, b) => a + b, 0),
    modules: Object.keys(modules).sort(),
  },
  gzipBytes: gzip,
})

/**
 * Compares the build with the record. It fails for an `effect` module the record does not have
 * (the browser started to import more of `effect`), and for `effect` or the whole bundle growing
 * past the record by more than `slack`.
 */
export const compare = (current, record) => {
  const problems = []
  const known = new Set(record.effect.modules)
  const added = current.effect.modules.filter((m) => !known.has(m))
  if (added.length > 0) {
    problems.push(
      `The browser bundle now includes ${added.length} more module(s) of effect:\n  ${added.join('\n  ')}`,
    )
  }
  if (current.effect.bytes > record.effect.bytes * slack) {
    problems.push(
      `effect grew from ${record.effect.bytes} to ${current.effect.bytes} bytes (more than ${Math.round((slack - 1) * 100)}%)`,
    )
  }
  if (current.gzipBytes > record.gzipBytes * slack) {
    problems.push(
      `The scripts grew from ${record.gzipBytes} to ${current.gzipBytes} bytes gzipped (more than ${Math.round((slack - 1) * 100)}%)`,
    )
  }
  return problems
}

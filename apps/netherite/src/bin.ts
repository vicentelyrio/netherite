import { NodeServices } from '@effect/platform-node'
import { runCli } from '@netherite/cli'
import { Effect } from 'effect'
import pkg from '../package.json' with { type: 'json' }

const stop = new AbortController()
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => stop.abort())

const code = await Effect.runPromise(
  runCli(
    process.argv.slice(2),
    {
      cwd: process.cwd(),
      serve: { signal: stop.signal },
      out: {
        line: (text) => void process.stdout.write(`${text}\n`),
        error: (text) => void process.stderr.write(`${text}\n`),
      },
    },
    pkg.version,
  ).pipe(Effect.provide(NodeServices.layer)),
)
process.exitCode = code

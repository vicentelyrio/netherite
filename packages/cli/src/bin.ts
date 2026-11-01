import { NodeServices } from '@effect/platform-node'
import { Effect } from 'effect'
import pkg from '../package.json' with { type: 'json' }
import { runCli } from './cli'

const code = await Effect.runPromise(
  runCli(
    process.argv.slice(2),
    {
      cwd: process.cwd(),
      out: {
        line: (text) => void process.stdout.write(`${text}\n`),
        error: (text) => void process.stderr.write(`${text}\n`),
      },
    },
    pkg.version,
  ).pipe(Effect.provide(NodeServices.layer)),
)
process.exitCode = code

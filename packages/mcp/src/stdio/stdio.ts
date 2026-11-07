import type { Readable, Writable } from 'node:stream'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Effect } from 'effect'
import type { McpHandle } from '../server'

export interface StdioOptions {
  readonly input?: Readable
  readonly output?: Writable
}

export const serveStdio = (handle: McpHandle, options: StdioOptions = {}) =>
  Effect.promise(
    () =>
      new Promise<void>((resolve) => {
        const input = options.input ?? process.stdin
        const transport = new StdioServerTransport(input, options.output ?? process.stdout)
        handle.server.onclose = () => resolve()
        input.once('end', () => void handle.server.close())
        input.once('close', () => void handle.server.close())
        void handle.server.connect(transport)
      }),
  )

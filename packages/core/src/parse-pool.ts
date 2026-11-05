import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { availableParallelism } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Worker } from 'node:worker_threads'
import { type Outline, outlineMarkdown } from '@netherite/markdown'
import { Effect } from 'effect'
import { type ScannedItem, scannedItemFrom } from './scanned-item'

export interface SourceFile {
  /** Path relative to the workspace root. */
  readonly path: string
  readonly source: string
}

export interface ParseOptions {
  /** Maximum number of worker threads. `0` parses on the calling thread. Default: up to 4. */
  readonly workers?: number
  /** Below this many files, parse on the calling thread. Starting workers costs about 100 ms. */
  readonly parallelThreshold?: number
}

const defaultThreshold = 400
const filesPerWorkerAtLeast = 150

const workerSource = (markdownUrl: string) => `
import { parentPort } from 'node:worker_threads'
import { outlineMarkdown } from ${JSON.stringify(markdownUrl)}
parentPort.on('message', (batch) => {
  parentPort.postMessage(
    batch.map(({ path, source }) => {
      const { source: _source, ...outline } = outlineMarkdown(source)
      return { path, outline }
    }),
  )
})
`

/**
 * Where the worker threads import the Markdown parser from: the workspace package when this runs
 * from source or a checkout, or `markdown.mjs` next to the program when it runs from the published
 * `netherite` package, which bundles everything into one file. Throws when neither is there, and
 * the caller then parses on its own thread.
 */
const markdownUrl = () => {
  try {
    return pathToFileURL(createRequire(import.meta.url).resolve('@netherite/markdown')).href
  } catch {
    const bundled = new URL('./markdown.mjs', import.meta.url)
    if (existsSync(fileURLToPath(bundled))) return bundled.href
    throw new Error('The Markdown parser cannot be found for worker threads')
  }
}

interface Parsed {
  readonly path: string
  /** The outline without `source`, which the main thread already has. */
  readonly outline: Omit<Outline, 'source'>
}

const runWorker = (batch: ReadonlyArray<SourceFile>, url: string) =>
  new Promise<Parsed[]>((resolve, reject) => {
    const worker = new Worker(
      new URL(`data:text/javascript,${encodeURIComponent(workerSource(url))}`),
    )
    worker.once('message', (result: Parsed[]) => {
      void worker.terminate()
      resolve(result)
    })
    worker.once('error', reject)
    worker.postMessage(batch)
  })

const inProcess = (files: ReadonlyArray<SourceFile>): ScannedItem[] =>
  files.map(({ path, source }) => scannedItemFrom(path, outlineMarkdown(source)))

/**
 * Parses many files into scanned items. Large sets are split across worker threads, because
 * parsing Markdown is CPU-bound and the editor's start-up target is 2 s for 5,000 files
 * (ADR-00014). Results keep the order of `files`. If threads are unavailable it parses on the
 * calling thread, so the result is the same either way.
 */
export const parseFiles = (files: ReadonlyArray<SourceFile>, options: ParseOptions = {}) =>
  Effect.promise(async (): Promise<ScannedItem[]> => {
    const threshold = options.parallelThreshold ?? defaultThreshold
    const limit = options.workers ?? Math.min(4, availableParallelism() - 1)
    const workers = Math.min(limit, Math.ceil(files.length / filesPerWorkerAtLeast))
    if (workers < 2 || files.length < threshold) return inProcess(files)

    try {
      const url = markdownUrl()
      const size = Math.ceil(files.length / workers)
      const batches = Array.from({ length: workers }, (_, i) =>
        files.slice(i * size, (i + 1) * size),
      )
      const parsed = (await Promise.all(batches.map((batch) => runWorker(batch, url)))).flat()
      const sources = new Map(files.map((file) => [file.path, file.source]))
      return parsed.map(({ path, outline }) =>
        scannedItemFrom(path, { ...outline, source: sources.get(path) ?? '' }),
      )
    } catch {
      return inProcess(files)
    }
  })

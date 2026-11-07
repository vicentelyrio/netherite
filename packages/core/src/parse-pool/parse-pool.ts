import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { availableParallelism } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Worker } from 'node:worker_threads'
import { type Outline, outlineMarkdown } from '@netherite/markdown'
import { settingDefaults } from '@netherite/schema'
import { Effect } from 'effect'
import { type ScannedItem, scannedItemFrom } from '../scanned-item'

export interface SourceFile {
  readonly path: string
  readonly source: string
}

export interface ParseOptions {
  readonly workers?: number
  readonly parallelThreshold?: number
}

const defaultThreshold = settingDefaults.performance.parsePoolThreshold

const filesPerWorkerAtLeast = settingDefaults.performance.parsePoolFilesPerWorker

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

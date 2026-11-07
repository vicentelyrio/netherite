import { ItemType } from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import picomatch from 'picomatch'
import { pathMap } from '../gitpaths'
import { normalizeSource } from '../source'
import type { Workspace } from '../workspace'
import type { WorkspaceIndex } from '../workspace-index'
import { adrDate, adrNumber, adrStatus, pad } from './adrHeader'
import {
  adrFolder,
  agentFile,
  examplesPerGroup,
  hiddenKept,
  labels,
  managedFolders,
  markdown,
  maxBytes,
  notDocs,
  pruned,
  runbookWords,
  secretPattern,
  templateName,
} from './survey.constants'
import type {
  SkippedGroup,
  SkipReason,
  Survey,
  SurveyEntry,
  SurveyOptions,
  SurveyType,
} from './survey.types'

const gitignored = (text: string | undefined) => {
  const patterns = (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#') && !l.startsWith('!'))
    .flatMap((raw) => {
      const anchored = raw.startsWith('/') || raw.replace(/\/$/, '').includes('/')
      const body = raw.replace(/^\//, '').replace(/\/$/, '')
      return anchored ? [body, `${body}/**`] : [`**/${body}`, `**/${body}/**`, body, `${body}/**`]
    })
  if (patterns.length === 0) return (_path: string) => false
  const match = picomatch(patterns, { dot: true })
  return (path: string) => match(path)
}

const isStub = (text: string) => {
  const body = text.replace(/\s+/g, ' ').trim()
  return body.length < 80 && /^@\S+\.md$/.test(body)
}

export const surveyRepository = (
  workspace: Pick<Workspace, 'root' | 'contentRoot'>,
  index: Pick<WorkspaceIndex, 'items'>,
  options: SurveyOptions = {},
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const root = workspace.root
    const contentFolder = path.relative(root, workspace.contentRoot).split(path.sep).join('/')

    const ignoreFile = yield* fs
      .readFileString(path.join(root, '.gitignore'))
      .pipe(Effect.orElseSucceed(() => undefined as string | undefined))
    const isIgnored = gitignored(ignoreFile)

    const imported = new Set(
      index.items().flatMap((item) => {
        const data = item.parsed.frontmatter?.data
        const source =
          typeof data === 'object' && data !== null
            ? (data as Record<string, unknown>).source
            : undefined
        return typeof source === 'string' ? [normalizeSource(source)] : []
      }),
    )

    const skipped = new Map<SkipReason, string[]>()
    const skip = (reason: SkipReason, file: string) => {
      const list = skipped.get(reason) ?? []
      list.push(file)
      skipped.set(reason, list)
    }

    const files: string[] = []
    let scanned = 0
    const seen = new Set<string>()
    const walk = (dir: string): Effect.Effect<void> =>
      Effect.gen(function* () {
        const real = yield* fs.realPath(path.join(root, dir)).pipe(Effect.orElseSucceed(() => dir))
        if (seen.has(real)) return
        seen.add(real)
        const names = yield* fs
          .readDirectory(path.join(root, dir))
          .pipe(Effect.orElseSucceed(() => [] as string[]))
        for (const name of [...names].sort()) {
          const rel = dir === '' ? name : `${dir}/${name}`
          const info = yield* fs.stat(path.join(root, rel)).pipe(Effect.option)
          if (info._tag === 'None') continue
          if (info.value.type === 'Directory') {
            if (pruned.has(name) || rel === '.netherite' || rel === contentFolder) continue
            if (name.startsWith('.') && !hiddenKept.has(name)) continue
            if (isIgnored(rel)) continue
            if (managedFolders.has(name)) {
              yield* countManaged(rel)
              continue
            }
            yield* walk(rel)
          } else if (info.value.type === 'File') {
            scanned++
            if (!isIgnored(rel)) files.push(rel)
          }
        }
      })
    const countManaged = (dir: string): Effect.Effect<void> =>
      Effect.gen(function* () {
        const entries = yield* fs
          .readDirectory(path.join(root, dir), { recursive: true })
          .pipe(Effect.orElseSucceed(() => [] as string[]))
        for (const entry of entries) {
          if (markdown.test(entry)) {
            scanned++
            skip('managed-by-a-tool', `${dir}/${entry.split(path.sep).join('/')}`)
          }
        }
      })
    yield* walk('')

    const gitMap = options.git === undefined ? undefined : yield* pathMap(options.git, root)

    const typed: Array<{ entry: SurveyEntry; text: string }> = []
    for (const file of files) {
      const name = file.split('/').pop() ?? file
      const isConvention =
        agentFile.test(name) ||
        name === '.cursorrules' ||
        /^\.cursor\/rules\//.test(file) ||
        file === '.github/copilot-instructions.md' ||
        /^\.ai\/context\//.test(file)
      if (!markdown.test(name) && name !== '.cursorrules') continue
      if (!isConvention && file.startsWith('.claude/')) continue
      if (!isConvention && file.startsWith('.github/')) continue
      if (notDocs.test(name)) {
        skip('not-documentation', file)
        continue
      }
      if (templateName.test(name) || /(^|\/)templates?\//i.test(file)) {
        skip('template', file)
        continue
      }
      if (/(^|\/)(tests?|__tests__|__fixtures__|fixtures?|golden|__snapshots__)\//i.test(file)) {
        skip('test-data', file)
        continue
      }
      if (adrFolder.test(file) && /^(readme|index)\.[a-z]+$/i.test(name)) {
        skip('decision-index', file)
        continue
      }
      if (imported.has(file)) {
        skip('already-imported', file)
        continue
      }
      const depth = file.split('/').length
      if (agentFile.test(name) && depth > 3 && options.nestedAgentFiles !== true) {
        skip('nested-agent-file', file)
        continue
      }
      const info = yield* fs.stat(path.join(root, file)).pipe(Effect.option)
      if (info._tag === 'Some' && Number(info.value.size) > maxBytes) {
        skip('too-large', file)
        continue
      }
      const text = yield* fs
        .readFileString(path.join(root, file))
        .pipe(Effect.orElseSucceed(() => undefined as string | undefined))
      if (text === undefined) continue
      if (secretPattern.test(text)) {
        skip('maybe-a-secret', file)
        continue
      }
      if (isStub(text)) {
        skip('stub', file)
        continue
      }

      const lower = file.toLowerCase()
      let type: SurveyType
      if (isConvention) type = 'context'
      else if (adrFolder.test(lower) && !/(^|\/)(readme|index)\.[a-z]+$/i.test(lower)) type = 'adr'
      else if (runbookWords.test(lower)) type = 'runbook'
      else type = 'doc'
      typed.push({ entry: { source: file, type }, text })
    }

    const notes: string[] = []
    const numbers = new Map<number, string>()
    const entries: SurveyEntry[] = []
    const padding = 5
    for (const { entry, text } of typed) {
      if (entry.type !== ItemType.Adr) {
        entries.push(entry)
        continue
      }
      const name = entry.source.split('/').pop() ?? entry.source
      const n = adrNumber(name)
      const fields: Record<string, string> = {}
      const status = adrStatus(text)
      if (status !== undefined) fields.status = status
      let date = adrDate(text)
      if (date === undefined && options.git !== undefined && gitMap !== undefined) {
        const first = yield* options.git
          .firstCommit(gitMap.toGit(entry.source))
          .pipe(Effect.orElseSucceed(() => undefined))
        date = first?.date.slice(0, 10)
      }
      if (date !== undefined) fields.date = date
      let id: string | undefined
      if (n !== undefined) {
        const taken = numbers.get(n)
        if (taken === undefined) {
          numbers.set(n, entry.source)
          id = `ADR-${pad(n, padding)}`
        } else {
          notes.push(
            `${entry.source} has the number ${n}, like ${taken}: it will get the next free ID unless you give it one`,
          )
        }
      }
      entries.push({
        source: entry.source,
        type: 'adr',
        ...(id === undefined ? {} : { id }),
        ...(Object.keys(fields).length === 0 ? {} : { fields }),
      })
    }

    const order: Record<SurveyType, number> = { adr: 0, doc: 1, runbook: 2, context: 3 }
    const depthOf = (s: SurveyEntry) => s.source.split('/').length
    entries.sort(
      (a, b) =>
        order[a.type] - order[b.type] ||
        depthOf(a) - depthOf(b) ||
        a.source.localeCompare(b.source),
    )

    const groups: SkippedGroup[] = [...skipped.entries()].map(([reason, list]) => ({
      reason,
      label: labels[reason],
      count: list.length,
      examples: list.slice(0, examplesPerGroup),
    }))
    const rank = Object.keys(labels)
    groups.sort((a, b) => rank.indexOf(a.reason) - rank.indexOf(b.reason))
    return { scanned, entries, skipped: groups, notes } satisfies Survey
  })

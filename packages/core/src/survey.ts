import type { GitRepository } from '@netherite/git'
import { Effect, FileSystem, Path } from 'effect'
import picomatch from 'picomatch'
import { pathMap } from './gitpaths'
import { normalizeSource } from './source'
import type { Workspace } from './workspace'
import type { WorkspaceIndex } from './workspace-index'

/**
 * A survey of a repository for what is already written down (ADR-00026): docs, runbooks, decision
 * records and the files agents read. It only reads. The result is a draft batch for
 * `netherite import`, and an account of what was left out and why, so the person can review both.
 */
export type SurveyType = 'doc' | 'runbook' | 'context' | 'adr'

/** One entry of the draft batch, in the shape `netherite import` reads. */
export interface SurveyEntry {
  readonly source: string
  readonly type: SurveyType
  readonly id?: string
  readonly fields?: Readonly<Record<string, string>>
}

/** Why files were left out of the batch. */
export type SkipReason =
  | 'already-imported'
  | 'nested-agent-file'
  | 'stub'
  | 'managed-by-a-tool'
  | 'not-documentation'
  | 'template'
  | 'test-data'
  | 'decision-index'
  | 'maybe-a-secret'
  | 'too-large'

export interface SkippedGroup {
  readonly reason: SkipReason
  /** What the group is, in a few words. */
  readonly label: string
  readonly count: number
  /** A few of the paths, so the person can see what they are. */
  readonly examples: ReadonlyArray<string>
}

export interface Survey {
  /** Files looked at: every file the walk reached, whatever its kind. */
  readonly scanned: number
  readonly entries: ReadonlyArray<SurveyEntry>
  readonly skipped: ReadonlyArray<SkippedGroup>
  /** Things to look at before importing, such as two records with the same number. */
  readonly notes: ReadonlyArray<string>
}

export interface SurveyOptions {
  /** The repository's git history, to date a decision record that does not date itself. */
  readonly git?: GitRepository | undefined
  /** Include the per-folder `AGENTS.md` and `CLAUDE.md` files, which are left out by default. */
  readonly nestedAgentFiles?: boolean | undefined
}

const labels: Record<SkipReason, string> = {
  'already-imported': 'already imported',
  'nested-agent-file':
    'per-folder agent files (agents read them in place; they would fill the context budget)',
  stub: 'stubs that only point at another file',
  'managed-by-a-tool': 'folders another tool manages and rewrites',
  'not-documentation': 'changelogs, licences and similar',
  template: 'templates',
  'test-data': 'test fixtures, golden files and snapshots',
  'decision-index': 'the index of a decision record folder (the records are the content)',
  'maybe-a-secret': 'files that look like they hold a secret (not read into the batch)',
  'too-large': 'files over 1 MB',
}

/** Folders that are never walked into. */
const pruned = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  '.parcel-cache',
  'target',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  '.tox',
  '.gradle',
  '.idea',
  '.vscode',
  '.yarn',
  '.pnpm-store',
  '.terraform',
])

/** Folders that another tool owns and keeps rewriting. */
const managedFolders = new Set(['openspec', '.changeset', '.changes', 'changelog.d', '.vitepress'])

/** Hidden folders that still hold things worth importing. */
const hiddenKept = new Set(['.ai', '.claude', '.cursor', '.github', '.agents'])

const markdown = /\.(md|mdx|mdc|markdown)$/i
// Written in capitals by convention: `docs/agents.md` is a page about agents, not their file.
const agentFile = /^(AGENTS|CLAUDE|GEMINI)\.md$/
const notDocs =
  /^(changelog|changes|history|license|licence|copying|notice|authors|contributors|code_of_conduct)(\.[a-z]+)?$/i
const templateName =
  /(^|[-_.])(template|tpl)([-_.]|$)|^_template|issue_template|pull_request_template/i
const secretPattern =
  /(npm_[A-Za-z0-9]{36}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-[A-Za-z0-9]{32,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})/
const adrFolder = /(^|\/)(adrs?|decisions?|architecture-decisions?|rfcs?|arch)(\/|$)/i
const runbookWords = /(^|[/_.-])(runbooks?|playbooks?|on-?call|oncall|incident)([/_.-]|$)/i
const maxBytes = 1024 * 1024

const examplesPerGroup = 4

const pad = (n: number, width: number) => String(n).padStart(width, '0')

/** An ADR's number from its file name: `0062-x.md`, `adr-7-x.md`, `12_x.md`. */
const adrNumber = (name: string): number | undefined => {
  const m = name.match(/^(?:adr[-_ ]*)?(\d{1,5})(?:[-_. ]|$)/i)
  return m === null ? undefined : Number(m[1])
}

/** The status a decision record states: `Status: x`, `- **Status:** x`, or a `## Status` section. */
const adrStatus = (text: string): string | undefined => {
  const line = text.match(/^\s*[-*]?\s*\**status\**:\**\s*(.+)$/im)?.[1]
  const section = text.match(/^#{1,4}\s*status\s*\r?\n+\s*([^\r\n#].*)$/im)?.[1]
  const raw = (line ?? section)
    ?.replace(/[*_`[\]]/g, '')
    .trim()
    .toLowerCase()
  if (raw === undefined || raw === '') return undefined
  if (raw.startsWith('superseded')) return 'superseded'
  if (raw.startsWith('deprecated') || raw.startsWith('retired') || raw.startsWith('rejected')) {
    return 'deprecated'
  }
  if (raw.startsWith('accepted') || raw.startsWith('approved') || raw.startsWith('adopted')) {
    return 'accepted'
  }
  if (raw.startsWith('proposed') || raw.startsWith('draft')) return 'proposed'
  return undefined
}

/** The date a decision record states, `YYYY-MM-DD`. */
const adrDate = (text: string): string | undefined =>
  text.match(/^\s*[-*]?\s*\**date\**:\**\s*(\d{4}-\d{2}-\d{2})/im)?.[1] ??
  text.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/im)?.[1]

/** Matchers for the root `.gitignore`: plain names and globs, not negations. */
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

/**
 * Walks the repository from the workspace root and sorts every Markdown file and agent file into a
 * draft batch or a group of files left out.
 */
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

    // The walk: every file, with the folders that are never entered left out.
    const files: string[] = []
    let scanned = 0
    const seen = new Set<string>()
    const walk = (dir: string): Effect.Effect<void> =>
      Effect.gen(function* () {
        const real = yield* fs.realPath(path.join(root, dir)).pipe(Effect.orElseSucceed(() => dir))
        // A symlink to a folder that was already walked is the same folder, not a second one.
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
    // Files inside a folder another tool manages are counted, so the person can see the size of it.
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
      if (!isConvention && file.startsWith('.claude/')) continue // commands, agents, skills
      if (!isConvention && file.startsWith('.github/')) continue // workflows, issue templates
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
      // The root and each app's own file are kept; the ones deeper in the tree are left out.
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

    // Decision records keep their numbers, and take the status and date they state.
    const notes: string[] = []
    const numbers = new Map<number, string>()
    const entries: SurveyEntry[] = []
    const padding = 5
    for (const { entry, text } of typed) {
      if (entry.type !== 'adr') {
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
    // By type, then the files at the top of the repository first, then the rest by path.
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

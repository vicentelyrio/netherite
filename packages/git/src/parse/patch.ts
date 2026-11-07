import { type CommitInfo, parseLog, recordSeparator } from './log'

export interface PatchHunk {
  readonly newStart: number
  readonly lines: ReadonlyArray<string>
}

export interface FilePatch {
  readonly path: string
  readonly added: boolean
  readonly deleted: boolean
  readonly hunks: ReadonlyArray<PatchHunk>
}

export interface CommitPatch extends CommitInfo {
  readonly patches: ReadonlyArray<FilePatch>
}

const stripTab = (text: string) => text.replace(/\t$/, '')

const parseFilePatch = (section: string[]): FilePatch | undefined => {
  let oldPath: string | undefined
  let newPath: string | undefined
  let added = false
  let deleted = false
  const hunks: PatchHunk[] = []
  let current: { newStart: number; lines: string[] } | undefined

  for (const line of section) {
    if (current !== undefined && !line.startsWith('@@')) {
      const mark = line[0]
      if (mark === ' ' || mark === '+') current.lines.push(line.slice(1))
      else if (mark === '-' || mark === '\\') {
      } else {
        current = undefined
      }
      continue
    }
    if (line.startsWith('@@')) {
      const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
      if (match === null) continue
      current = { newStart: Number(match[1]), lines: [] }
      hunks.push(current)
    } else if (line.startsWith('new file mode')) added = true
    else if (line.startsWith('deleted file mode')) deleted = true
    else if (line.startsWith('--- ')) oldPath = line.slice(4)
    else if (line.startsWith('+++ ')) newPath = line.slice(4)
  }

  const clean = (p: string | undefined, prefix: string) =>
    p === undefined || p === '/dev/null'
      ? undefined
      : stripTab(p).replace(new RegExp(`^${prefix}/`), '')
  const path = deleted ? clean(oldPath, 'a') : clean(newPath, 'b')
  if (path === undefined) return undefined
  return { path, added, deleted, hunks }
}

export const parsePatchLog = (output: string): CommitPatch[] => {
  const commits: CommitPatch[] = []
  for (const record of output.split(recordSeparator)) {
    if (record.trim() === '') continue
    const [header = '', ...rest] = record.split('\n')
    const info = parseLog(`${recordSeparator}${header}`, 'none')[0]
    if (info === undefined) continue

    const patches: FilePatch[] = []
    let section: string[] | undefined
    const flush = () => {
      if (section === undefined) return
      const patch = parseFilePatch(section)
      if (patch !== undefined) patches.push(patch)
    }
    for (const line of rest) {
      if (line.startsWith('diff --git ')) {
        flush()
        section = []
      } else {
        section?.push(line)
      }
    }
    flush()
    commits.push({ ...info, files: patches.map((p) => ({ path: p.path })), patches })
  }
  return commits
}

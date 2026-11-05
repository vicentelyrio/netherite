export interface StatusEntry {
  readonly path: string
  readonly from?: string
  readonly kind: 'ordinary' | 'renamed' | 'unmerged' | 'untracked' | 'ignored'
  readonly index: string
  readonly worktree: string
}

export interface GitStatus {
  readonly oid: string | undefined
  readonly branch: string | undefined
  readonly upstream: string | undefined
  readonly ahead: number
  readonly behind: number
  readonly entries: ReadonlyArray<StatusEntry>
}

export const changedPaths = (status: GitStatus) =>
  status.entries.filter((e) => e.kind !== 'ignored').map((e) => e.path)

export const parseStatus = (output: string): GitStatus => {
  let oid: string | undefined
  let branch: string | undefined
  let upstream: string | undefined
  let ahead = 0
  let behind = 0
  const entries: StatusEntry[] = []

  const fields = output.split('\0')
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i] as string
    if (field === '') continue
    if (field.startsWith('# ')) {
      const [key, ...rest] = field.slice(2).split(' ')
      const value = rest.join(' ')
      if (key === 'branch.oid') oid = value === '(initial)' ? undefined : value
      else if (key === 'branch.head') branch = value === '(detached)' ? undefined : value
      else if (key === 'branch.upstream') upstream = value
      else if (key === 'branch.ab') {
        const match = /\+(\d+) -(\d+)/.exec(value)
        ahead = Number(match?.[1] ?? 0)
        behind = Number(match?.[2] ?? 0)
      }
      continue
    }
    const kind = field[0]
    if (kind === '1') {
      const parts = field.split(' ')
      const xy = parts[1] ?? '..'
      entries.push({
        path: parts.slice(8).join(' '),
        kind: 'ordinary',
        index: xy[0] ?? '.',
        worktree: xy[1] ?? '.',
      })
    } else if (kind === '2') {
      const parts = field.split(' ')
      const xy = parts[1] ?? '..'
      const from = fields[++i]
      entries.push({
        path: parts.slice(9).join(' '),
        ...(from === undefined ? {} : { from }),
        kind: 'renamed',
        index: xy[0] ?? '.',
        worktree: xy[1] ?? '.',
      })
    } else if (kind === 'u') {
      const parts = field.split(' ')
      const xy = parts[1] ?? 'UU'
      entries.push({
        path: parts.slice(10).join(' '),
        kind: 'unmerged',
        index: xy[0] ?? 'U',
        worktree: xy[1] ?? 'U',
      })
    } else if (kind === '?') {
      entries.push({ path: field.slice(2), kind: 'untracked', index: '.', worktree: '?' })
    } else if (kind === '!') {
      entries.push({ path: field.slice(2), kind: 'ignored', index: '.', worktree: '!' })
    }
  }
  return { oid, branch, upstream, ahead, behind, entries }
}

export interface FileChange {
  readonly path: string
  readonly added?: number | undefined
  readonly deleted?: number | undefined
}

export interface CommitInfo {
  readonly hash: string
  readonly author: { readonly name: string; readonly email: string }
  readonly date: string
  readonly committerDate: string
  readonly subject: string
  readonly files: ReadonlyArray<FileChange>
}

export const recordSeparator = '\x1e'
export const fieldSeparator = '\x1f'

export const logFormat = `${recordSeparator}%H${fieldSeparator}%an${fieldSeparator}%ae${fieldSeparator}%aI${fieldSeparator}%cI${fieldSeparator}%s`

export const parseLog = (output: string, mode: 'none' | 'names' | 'numstat'): CommitInfo[] => {
  const commits: CommitInfo[] = []
  for (const record of output.split(recordSeparator)) {
    if (record.trim() === '') continue
    const newline = record.indexOf('\n')
    const header = newline === -1 ? record : record.slice(0, newline)
    const body = newline === -1 ? '' : record.slice(newline + 1)
    const [hash, name, email, date, committerDate, ...subject] = header.split(fieldSeparator)
    if (hash === undefined) continue

    const files: FileChange[] = []
    if (mode !== 'none') {
      for (const line of body.split('\n')) {
        if (line === '') continue
        if (mode === 'names') {
          files.push({ path: line })
          continue
        }
        const [added, deleted, ...path] = line.split('\t')
        if (path.length === 0) continue
        files.push({
          path: path.join('\t'),
          added: added === '-' ? undefined : Number(added),
          deleted: deleted === '-' ? undefined : Number(deleted),
        })
      }
    }
    commits.push({
      hash,
      author: { name: name ?? '', email: email ?? '' },
      date: date ?? '',
      committerDate: committerDate ?? '',
      subject: subject.join(fieldSeparator),
      files,
    })
  }
  return commits
}

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

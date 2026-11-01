/** A file's state in `git status`. Letters are git's own: `M` modified, `A` added, `D` deleted, `R` renamed, `.` unchanged. */
export interface StatusEntry {
  readonly path: string
  /** For a rename or copy, the path it came from. */
  readonly from?: string
  readonly kind: 'ordinary' | 'renamed' | 'unmerged' | 'untracked' | 'ignored'
  /** State in the index (staged), or `.`. */
  readonly index: string
  /** State in the work tree (unstaged), or `.`. */
  readonly worktree: string
}

export interface GitStatus {
  /** Current commit, or `undefined` before the first commit. */
  readonly oid: string | undefined
  /** Branch name, or `undefined` for a detached HEAD. */
  readonly branch: string | undefined
  readonly upstream: string | undefined
  readonly ahead: number
  readonly behind: number
  readonly entries: ReadonlyArray<StatusEntry>
}

/** Paths with uncommitted changes of any kind, untracked included. */
export const changedPaths = (status: GitStatus) =>
  status.entries.filter((e) => e.kind !== 'ignored').map((e) => e.path)

/**
 * Parses `git status --porcelain=v2 --branch -z`. Entries are separated by NUL; a rename is
 * followed by one more NUL-separated field holding the old path.
 */
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
      // 1 XY sub mH mI mW hH hI path
      const parts = field.split(' ')
      const xy = parts[1] ?? '..'
      entries.push({
        path: parts.slice(8).join(' '),
        kind: 'ordinary',
        index: xy[0] ?? '.',
        worktree: xy[1] ?? '.',
      })
    } else if (kind === '2') {
      // 2 XY sub mH mI mW hH hI Xscore path, then the original path as the next field
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
      // u XY sub m1 m2 m3 mW h1 h2 h3 path
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
  /** Lines added and removed. Only with `numstat`; `undefined` for binary files. */
  readonly added?: number | undefined
  readonly deleted?: number | undefined
}

export interface CommitInfo {
  readonly hash: string
  readonly author: { readonly name: string; readonly email: string }
  /** ISO 8601, strict. */
  readonly date: string
  readonly committerDate: string
  readonly subject: string
  /** Files the commit touched. Empty unless `files` was asked for. */
  readonly files: ReadonlyArray<FileChange>
}

export const recordSeparator = '\x1e'
export const fieldSeparator = '\x1f'

/** The `--format` that `parseLog` reads. */
export const logFormat = `${recordSeparator}%H${fieldSeparator}%an${fieldSeparator}%ae${fieldSeparator}%aI${fieldSeparator}%cI${fieldSeparator}%s`

/**
 * Parses `git log --format=<logFormat>` with `--name-only` or `--numstat` and `--no-renames`
 * (renames show as a delete and an add, so a path's history is simple to count).
 */
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

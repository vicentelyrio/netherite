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

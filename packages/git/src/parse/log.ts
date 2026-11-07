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

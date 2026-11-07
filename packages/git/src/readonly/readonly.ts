import { ForbiddenGitCommand } from '../errors'

export const readOnlySubcommands = [
  'status',
  'log',
  'rev-parse',
  'rev-list',
  'config',
  'diff',
  'show',
  'ls-files',
  'cat-file',
  'merge-base',
  'version',
] as const

export type ReadOnlySubcommand = (typeof readOnlySubcommands)[number]

const writingFlags = [
  '--output',
  '--ext-diff',
  '--textconv',
  '--exec',
  '--add',
  '--unset',
  '--unset-all',
  '--replace-all',
  '--rename-section',
  '--remove-section',
  '--edit',
  '-e',
  '--global',
  '--system',
  '--file',
  '-f',
]

export const assertReadOnly = (args: ReadonlyArray<string>) => {
  const [subcommand, ...allRest] = args
  const end = allRest.indexOf('--')
  const rest = end === -1 ? allRest : allRest.slice(0, end)
  if (!(readOnlySubcommands as ReadonlyArray<string>).includes(subcommand ?? '')) {
    return new ForbiddenGitCommand({
      args,
      reason: `"${subcommand ?? ''}" is not a read-only command`,
    })
  }
  const writing = rest.find(
    (arg) => arg.startsWith('-') && writingFlags.some((f) => arg === f || arg.startsWith(`${f}=`)),
  )
  if (writing !== undefined) {
    return new ForbiddenGitCommand({ args, reason: `${writing} could change the repository` })
  }
  if (subcommand === 'config') {
    const reads = rest.some((arg) =>
      ['--get', '--get-all', '--get-regexp', '--list', '-l'].includes(arg),
    )
    if (!reads) return new ForbiddenGitCommand({ args, reason: 'config may only read values' })
  }
  return undefined
}

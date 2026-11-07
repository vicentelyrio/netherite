export const contentIgnore = [
  '**/.*/**',
  '**/.*',
  'assets/**',
  'templates/**',
  '**/node_modules/**',
]

export const configIgnore = ['local/**', '**/*.tmp']

export const gitIgnore = [
  'objects/**',
  'logs/**',
  'hooks/**',
  'info/**',
  'modules/**',
  '**/*.lock',
  '**/*.tmp',
]

export const gitRelevant = (relative: string) =>
  relative === 'HEAD' ||
  relative === 'index' ||
  relative === 'packed-refs' ||
  relative.startsWith('refs/')

export const asPosix = (p: string) => p.split('\\').join('/')

export const notHidden = (relative: string) =>
  !relative.split('/').some((part) => part.startsWith('.'))

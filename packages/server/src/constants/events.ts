export const ServerEventType = {
  Items: 'items',
  Git: 'git',
  Config: 'config',
  ConfigInvalid: 'config-invalid',
  Lint: 'lint',
} as const

export const lintTriggers: ReadonlySet<string> = new Set([
  ServerEventType.Items,
  ServerEventType.Git,
  ServerEventType.Config,
])

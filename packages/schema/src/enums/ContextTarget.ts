export const ContextTarget = {
  Claude: 'claude',
  Agents: 'agents',
  Mcp: 'mcp',
} as const

export type ContextTarget = (typeof ContextTarget)[keyof typeof ContextTarget]

export interface ToolResult {
  [key: string]: unknown
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export const ok = (value: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
})

export const failure = (error: Record<string, unknown>): ToolResult => ({
  isError: true,
  content: [{ type: 'text', text: JSON.stringify({ error }, null, 2) }],
})

import { AdrStatus, ItemType, settingDefaults } from '@netherite/schema'
import type { WorkspaceIndex } from '../workspace-index'

export type ContextTarget = 'claude' | 'agents' | 'mcp'

export interface ContextItem {
  readonly id: string
  readonly path: string
  readonly title: string
  readonly priority: 'high' | 'normal' | 'low'
  readonly tokens: number
}

export interface ContextBundle {
  readonly text: string
  readonly included: ReadonlyArray<ContextItem>
  readonly omitted: ReadonlyArray<ContextItem>
  readonly tokens: number
  readonly budget: number
}

export interface ContextOptions {
  readonly budget?: number
  readonly target?: ContextTarget
  readonly project?: string
}

const priorityRank = { high: 0, normal: 1, low: 2 } as const

export const estimateTokens = (text: string) => Math.ceil(text.length / 4)

const dataOf = (source: string, start: number) => source.slice(start)

export const buildContext = (
  index: WorkspaceIndex,
  options: ContextOptions = {},
): ContextBundle => {
  const budget = options.budget ?? settingDefaults.context.budget
  const target = options.target ?? 'mcp'

  const wanted = index
    .items()
    .filter((item) => item.type === ItemType.Context)
    .flatMap((item) => {
      const data = item.parsed.frontmatter?.data
      if (typeof data !== 'object' || data === null) return []
      const fields = data as Record<string, unknown>
      if (fields.include_in_context !== true) return []
      if (fields.status === AdrStatus.Superseded || fields.status === AdrStatus.Deprecated)
        return []
      const targets = Array.isArray(fields.targets) ? fields.targets : undefined
      if (targets !== undefined && !targets.includes(target)) return []
      if (
        options.project !== undefined &&
        typeof fields.project === 'string' &&
        fields.project !== options.project
      )
        return []
      const priority: ContextItem['priority'] =
        fields.priority === 'high' || fields.priority === 'low' ? fields.priority : 'normal'
      const title = item.title ?? item.id ?? item.fileName
      const body = dataOf(item.parsed.source, item.parsed.bodyStart)
        .trim()
        .replace(/^# .*\n+/, '')
        .trim()
      const rendered = `## ${title} (${item.id ?? item.path})\n\n${body}\n`
      return [{ item, priority, rendered }]
    })
    .sort(
      (a, b) =>
        priorityRank[a.priority] - priorityRank[b.priority] ||
        (a.item.id ?? '').localeCompare(b.item.id ?? ''),
    )

  const included: ContextItem[] = []
  const omitted: ContextItem[] = []
  const parts: string[] = []
  let used = 0
  for (const { item, priority, rendered } of wanted) {
    const tokens = estimateTokens(rendered)
    const summary: ContextItem = {
      id: item.id ?? '',
      path: item.path,
      title: item.title ?? '',
      priority,
      tokens,
    }
    if (used + tokens <= budget) {
      used += tokens
      included.push(summary)
      parts.push(rendered)
    } else {
      omitted.push(summary)
    }
  }
  return { text: parts.join('\n'), included, omitted, tokens: used, budget }
}

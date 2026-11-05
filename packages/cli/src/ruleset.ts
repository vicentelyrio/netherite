import {
  createItem,
  gitHandle,
  matchesFilter,
  openRepo,
  syncContext,
  type TargetReport,
  workspaceGit,
} from '@netherite/core'
import { Effect } from 'effect'

export const rulesetTag = 'netherite-ruleset'

export const rulesetTitle = 'How agents work in this repository'

export const rulesetBody = `
This repository tracks its work with Netherite. Use the \`netherite\` MCP server, and keep the workspace true as you work.

## Plan first

- Before work of more than one step, \`search\` for a task or project that covers it. If none does, plan it with the \`netherite-plan\` skill: a project, tasks, and a checklist for each task.

## Track as you go

- Set the task \`doing\` when you start. Tick a checklist item with \`toggle_check\` when that part is done and verified, not before. Set the task \`done\` only when every item is ticked.
- Write what you learn in the task's Notes.

## Record decisions

- A choice with lasting consequences is a \`proposed\` ADR (\`netherite-adr\`). Never mark one \`accepted\` yourself. Never rewrite an accepted one: supersede it.

## Keep docs honest

- When code that a doc \`covers\` changes, review that doc (\`netherite-refresh\`) as part of the same work.

## Ask when it is the person's call

- Scope, naming and trade-offs are theirs. Put the options to them with a recommendation, and wait.
- Do not commit, push or merge unless asked. Run \`lint\` before you finish.
`

export interface RulesetReport {
  readonly status: 'created' | 'exists'
  readonly id: string
  readonly synced: ReadonlyArray<string>
}

export const ensureRuleset = (root: string) =>
  Effect.gen(function* () {
    const repo = yield* openRepo(root)
    const existing = repo.index
      .items()
      .find((item) => item.type === 'context' && matchesFilter(item, { tag: rulesetTag }))
    let id = existing?.id
    if (existing === undefined) {
      const createdBy = yield* gitHandle(yield* workspaceGit(repo.workspace))
      const made = yield* createItem(repo, {
        type: 'context',
        title: rulesetTitle,
        fields: {
          include_in_context: true,
          priority: 'high',
          targets: ['claude', 'agents', 'mcp'],
          tags: [rulesetTag],
        },
        body: rulesetBody,
        ...(createdBy === undefined ? {} : { createdBy }),
      })
      id = made.id
    }
    if (existing !== undefined)
      return { status: 'exists', id: id as string, synced: [] } satisfies RulesetReport
    const report = yield* syncContext(repo)
    const changed = report.targets.filter((t: TargetReport) => t.status !== 'unchanged')
    return {
      status: 'created',
      id: id as string,
      synced: changed.map((t: TargetReport) => t.path),
    } satisfies RulesetReport
  })

import { type ItemType, itemTypes } from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import type { Workspace } from './workspace'

/**
 * Starter text for each item type (ADR-00029): the frontmatter with every optional field in a
 * comment, then the sections the app and lint expect. `{{name}}` marks a value, filled by
 * `fillTemplate`. The templates hold no backticks and no `${`, so they stay plain strings.
 */
const goal = `---
id: {{id}}
aliases: [{{id}}]
type: goal
title: {{title}}
created: {{created}}
created_by: {{created_by}}
status: active
# area: Health               # the column the goal sits in on the Goals page
# horizon: 10 years         # forever, or a length such as 6 months or 90d
# due: 2026-12-31
# owner: "@handle"
# tags: [fitness]
---

# {{title}}

What you want to reach, and why it matters, in a few lines.

## Done when

How you will know it is reached: something you can check, not a feeling.

## Notes

Anything worth keeping that does not fit above.
`

const project = `---
id: {{id}}
aliases: [{{id}}]
type: project
title: {{title}}
created: {{created}}
created_by: {{created_by}}
goals: [{{goal}}]
status: active
# due: 2026-12-31
# milestone: Beta
# owner: "@handle"
# labels: [backend]
# decisions: [ADR-00001]     # decisions this project depends on
# design: []                 # links to designs
# tags: []
---

# {{title}}

What this project delivers and for which goal.

## Scope

What is in: the parts of the work, one line each.

## Out of scope

What is left out on purpose, so nobody wonders.

## Done when

The result that ends the project.
`

const task = `---
id: {{id}}
aliases: [{{id}}]
type: task
title: {{title}}
created: {{created}}
created_by: {{created_by}}
project: {{project}}
state: backlog
# assignees: ["@handle"]
# labels: [bug]
# depends_on: [TASK-00001]   # tasks that must be done first
# decisions: [ADR-00001]     # decisions this task follows
# related: [DOC-00001]       # anything else that helps
# due: 2026-12-31
# tags: []
---

# {{title}}

What needs doing and why, in one or two lines.

## Checklist

- [ ] First thing that must be true when this is done
- [ ] Second thing

## Notes

What was learned, what was tried, links.
`

const adr = `---
id: {{id}}
aliases: [{{id}}]
type: adr
title: {{title}}
created: {{created}}
created_by: {{created_by}}
status: proposed
date: {{date}}
deciders: [{{created_by}}]
# project: PRJ-00001
# supersedes: [ADR-00001]    # decisions this one replaces
# superseded_by: ADR-00002   # set when a later decision replaces this one
# tags: []
---

# {{title}}

## Context

The forces at play: what is the situation, what is being asked, what limits the choice.

## Decision

What was chosen, in the active voice: "We use X for Y."

- A bullet for each part of the decision.

## Consequences

- \\+ What gets easier or better.
- \\- What gets harder, and what is given up.
`

const doc = `---
id: {{id}}
aliases: [{{id}}]
type: doc
title: {{title}}
created: {{created}}
created_by: {{created_by}}
# covers: ["src/**"]         # the files this describes; it shows as stale when they change
# reviewed_at: 2026-01-15    # the day it was last checked against them
# owner: "@handle"
# project: PRJ-00001
# explains: [ADR-00001]      # decisions or items this gives the background of
# status: active             # deprecated or superseded when it is retired
# supersedes: []
# superseded_by: DOC-00002
# tags: []
---

# {{title}}

One paragraph: what this describes and who it is for.

## How it works

The parts, and how they fit together.

## How to use it

The common tasks, each with an example.

## Limits

What it does not do, and where it can surprise you.
`

const context = `---
id: {{id}}
aliases: [{{id}}]
type: context
title: {{title}}
created: {{created}}
created_by: {{created_by}}
include_in_context: true     # handed to agents; "netherite context sync" writes it to CLAUDE.md and AGENTS.md
priority: normal             # high, normal or low: what goes first when the token budget is short
# targets: [claude, agents]  # claude, agents, or mcp (served over MCP only)
# covers: ["src/**"]
# reviewed_at: 2026-01-15
# owner: "@handle"
# project: PRJ-00001
# status: active
# tags: []
---

# {{title}}

Rules and background an agent needs before it works here. Short, concrete and checkable: every
line costs tokens on every task.

## Rules

- One rule per line, written as an instruction.

## Layout

- Where things live, one line each.
`

const runbook = `---
id: {{id}}
aliases: [{{id}}]
type: runbook
title: {{title}}
created: {{created}}
created_by: {{created_by}}
# covers: ["scripts/deploy.sh"]  # the files these steps run; it shows as stale when they change
# reviewed_at: 2026-01-15
# owner: "@handle"
# project: PRJ-00001
# explains: []
# status: active
# supersedes: []
# superseded_by: RUN-00002
# tags: []
---

# {{title}}

When to use this runbook, in one line.

## Before you start

What you need: access, tools, a clean state.

## Steps

1. The first step, as a command or an action.
2. The next one.

## Check it worked

How to tell the result is right.

## If it goes wrong

What to do, and who to ask.
`

/** The template text for each item type, with its {{name}} placeholders. */
export const templates: Readonly<Record<ItemType, string>> = {
  goal,
  project,
  task,
  adr,
  doc,
  context,
  runbook,
}

/** The values a template can take. A line that uses one that is missing is dropped if optional. */
export interface TemplateValues {
  readonly id: string
  readonly title: string
  /** ISO 8601 date and time. */
  readonly created: string
  /** A day, `YYYY-MM-DD`. */
  readonly date: string
  /** A git identity such as `@ada`; lines that use it are left out when it is not given. */
  readonly createdBy?: string | undefined
  /** The project a task belongs to. */
  readonly project?: string | undefined
  /** The goal a project serves. */
  readonly goal?: string | undefined
}

const placeholder = /\{\{(\w+)\}\}/g

const valueFor = (values: TemplateValues, name: string): string | undefined => {
  switch (name) {
    case 'id':
      return values.id
    case 'title':
      return values.title
    case 'created':
      return values.created
    case 'date':
      return values.date
    case 'created_by':
      return values.createdBy
    case 'project':
      return values.project
    case 'goal':
      return values.goal
    default:
      return undefined
  }
}

/** The optional values; a line that needs one that is not given is left out. */
const optional = new Set(['created_by'])

const plain = /^[A-Za-z0-9](?:[A-Za-z0-9 _./()+-]|:(?=\S))*$/
const reservedWord = /^(?:true|false|null|yes|no|on|off|y|n|~)$/i
const looksNumeric = /^[\d.+-]+$/

/** A value as a YAML scalar: as it is when that is safe, in quotes when it is not. */
const yamlScalar = (value: string) =>
  plain.test(value) && !reservedWord.test(value) && !looksNumeric.test(value) && !/ $/.test(value)
    ? value
    : JSON.stringify(value)

/** A value a template needs but was not given. */
export class MissingTemplateValue extends Error {
  readonly _tag = 'MissingTemplateValue'
  constructor(readonly missing: string) {
    super(`The template needs a value for {{${missing}}}`)
  }
}

const frontmatterEnd = (text: string) => {
  const close = text.indexOf('\n---\n', 4)
  return close === -1 ? text.length : close + 5
}

/**
 * Fills a template into the text of an item. Values in the frontmatter are written as YAML
 * (quoted when needed); in the body they go in as they are. A line that uses `{{created_by}}`
 * is left out when there is no such value; any other missing value throws.
 */
export const fillTemplate = (type: ItemType, values: TemplateValues): string => {
  const text = templates[type]
  const split = frontmatterEnd(text)
  const fill = (part: string, inFrontmatter: boolean) =>
    part
      .split('\n')
      .flatMap((line) => {
        const names = [...line.matchAll(placeholder)].map((m) => m[1] as string)
        const missing = names.find((n) => valueFor(values, n) === undefined)
        if (missing !== undefined) {
          if (optional.has(missing)) return []
          throw new MissingTemplateValue(missing)
        }
        return [
          line.replace(placeholder, (_, name: string) => {
            const value = valueFor(values, name) as string
            return inFrontmatter ? yamlScalar(value) : value
          }),
        ]
      })
      .join('\n')
  return fill(text.slice(0, split), true) + fill(text.slice(split), false)
}

/** The text after the title heading of a template, with the title filled in: a body for `new`. */
export const templateBody = (text: string, title: string): string => {
  const rest = text.slice(frontmatterEnd(text)).replaceAll('{{title}}', title)
  const heading = rest.match(/^\s*# .*\n/)
  return (heading === null ? rest : rest.slice(heading[0].length)).trim()
}

/** The types that have a template: every item type. */
export const templateTypes: ReadonlyArray<ItemType> = itemTypes

/** The folder of the workspace's own templates, under the content root: `templates/<type>.md`. */
export const templatesFolder = 'templates'

export interface TemplateSource {
  readonly type: ItemType
  /** `workspace` when the workspace has its own file for the type, else the one that ships. */
  readonly source: 'workspace' | 'built-in'
  /** Path of the workspace's file, relative to the workspace root; absent for a built-in one. */
  readonly path?: string
  readonly text: string
}

/** The template to use for each type: the workspace's own file when there is one. */
export const readTemplates = (workspace: Pick<Workspace, 'root' | 'contentRoot'>) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    return yield* Effect.forEach(itemTypes, (type) =>
      Effect.gen(function* () {
        const file = path.join(workspace.contentRoot, templatesFolder, `${type}.md`)
        const own = yield* fs.readFileString(file).pipe(Effect.option)
        if (own._tag === 'None') {
          return { type, source: 'built-in', text: templates[type] } satisfies TemplateSource
        }
        return {
          type,
          source: 'workspace',
          path: path.relative(workspace.root, file).split(path.sep).join('/'),
          text: own.value,
        } satisfies TemplateSource
      }),
    )
  })

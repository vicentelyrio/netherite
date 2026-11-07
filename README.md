# Netherite

A typed, linked knowledge base that lives in your git repository as Markdown files.

**[Read the documentation](https://vicentelyrio.github.io/netherite/)** ·
[Get started](https://vicentelyrio.github.io/netherite/getting-started) ·
[Connect an agent](https://vicentelyrio.github.io/netherite/agents) ·
[CLI reference](https://vicentelyrio.github.io/netherite/reference/cli) ·
[npm](https://www.npmjs.com/package/@vicentelyrio/netherite)

Goals, projects, tasks, decisions (ADRs), docs and runbooks are plain `.md` files with YAML
frontmatter, linked by ID (`[[TASK-00042]]`). You edit them in any editor, agents read and write
them through an MCP server, and a local app shows them as boards, graphs and timelines. Everything
is in git: there is no database, no account and no cloud.

```text
netherite/
  goals/      GOAL-00001-run-a-marathon.md
  projects/   PRJ-00003-training-plan.md
  tasks/      TASK-00042-long-run.md
  adr/        ADR-00007-use-gnu-stow.md
  docs/       DOC-00002-shell-setup.md
  context/    CTX-00001-house-rules.md
  runbooks/   RUN-00004-bootstrap.md
```

## Quick start

You need Node 24 or newer and a git repository.

```sh
cd my-repo
npx @vicentelyrio/netherite init
npx @vicentelyrio/netherite
```

`init` adds the config, folders and agent skills, and is safe to run again. The second command opens
the app at <http://127.0.0.1:4747>.

The [getting started guide](https://vicentelyrio.github.io/netherite/getting-started) goes from
there to your first goal, project and task, with an agent connected.
Already have docs or decision records?
[Migrate them](https://vicentelyrio.github.io/netherite/migrate) instead of writing them again.

## Documentation

Everything about using Netherite is on the documentation site, with search across every page:
**<https://vicentelyrio.github.io/netherite/>**.

**Start**

| | |
| --- | --- |
| [Getting started](https://vicentelyrio.github.io/netherite/getting-started) | `init`, the app, the first items, agents and skills |
| [Install](https://vicentelyrio.github.io/netherite/install) | `npx` or global, upgrading, what `init` adds, troubleshooting |
| [Concepts](https://vicentelyrio.github.io/netherite/concepts) | items, IDs, links, states, freshness and context |

**Guides**

| | |
| --- | --- |
| [Agents](https://vicentelyrio.github.io/netherite/agents) | the skills, connecting Claude Code, Cursor and Codex, context |
| [Templates](https://vicentelyrio.github.io/netherite/templates) | a starter for each item type, `new --template`, and your own |
| [Migrate a repository](https://vicentelyrio.github.io/netherite/migrate) | bring an existing repository's docs, ADRs and conventions in |
| [Obsidian](https://vicentelyrio.github.io/netherite/obsidian) | opening the same files in Obsidian |

**Reference**

| | |
| --- | --- |
| [CLI](https://vicentelyrio.github.io/netherite/reference/cli) | every command and flag |
| [Configuration](https://vicentelyrio.github.io/netherite/reference/config) | `.netherite/config.yml` |
| [Lint rules](https://vicentelyrio.github.io/netherite/reference/lint) | what `netherite lint` reports and which problems it fixes |
| [Import](https://vicentelyrio.github.io/netherite/reference/import) | bring existing docs, runbooks and ADRs in from a reviewed batch file |
| [MCP](https://vicentelyrio.github.io/netherite/reference/mcp) | the tools and resources an agent sees |
| [Item schemas](https://vicentelyrio.github.io/netherite/reference/schemas) | the fields of each item type |

## What you get

- **The app** (`netherite`): goals by area, a kanban board per project, a task drawer with the file
  beside it, a knowledge index, a decision log, a graph, search (<kbd>⌘K</kbd>), an inbox, stats and
  tags. Edits write straight to the Markdown files; nothing is committed for you.
- **An [MCP server](https://vicentelyrio.github.io/netherite/agents#connect-the-mcp-server)**
  (`netherite mcp`): agents search, read, create and update items with the same rules as the app, so
  an agent cannot write a malformed file.
- **[Agent skills](https://vicentelyrio.github.io/netherite/agents)**: `init` installs short skills
  into `.claude/skills/` and a section in `AGENTS.md` that tell an agent how this repository tracks
  work.
- **A [linter](https://vicentelyrio.github.io/netherite/reference/lint)** (`netherite lint`): broken
  links, wrong fields, ID collisions, stale docs.
- **[Freshness](https://vicentelyrio.github.io/netherite/concepts#freshness)**: a doc that lists the
  code it `covers` is marked stale when that code has changed in git since the doc was reviewed.

## Developing

```sh
pnpm install
pnpm build           # all packages and the app
pnpm test            # unit and integration tests
pnpm e2e             # the app in a real browser (needs `pnpm build`)
pnpm lint
pnpm docs:dev        # the documentation site, locally
pnpm docs:gen        # regenerate apps/docs/reference from the program
```

The site's pages are in `apps/docs`, and each one has an edit link. This repository
tracks its own work in `netherite/`; the plan is in `netherite/docs/`.

## Licence

[MIT](LICENSE).

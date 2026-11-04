# Netherite

A typed, linked knowledge base that lives in your git repository as Markdown files.

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
npx @vicentelyrio/netherite init        # config, folders, .gitignore line, agent skills
npx @vicentelyrio/netherite             # the app, at http://127.0.0.1:4747
```

To type less, install it once with `npm install --global @vicentelyrio/netherite`; the command is then just `netherite`.

`init` is safe to run again. `npx @vicentelyrio/netherite serve --no-open` starts the same thing without opening
a browser. The server listens on `127.0.0.1` only.

Next: [getting started](docs/getting-started.md) walks through creating your first goal, project
and task, connecting an agent, and keeping the context file in sync.

## What you get

- **The app** (`netherite`): goals by area, a kanban board per project, a task drawer with the file
  beside it, a knowledge index, a decision log, a graph, search (<kbd>⌘K</kbd>), an inbox, stats and
  tags. Edits write straight to the Markdown files; nothing is committed for you.
- **An MCP server** (`netherite mcp`): agents search, read, create and update items with the same
  rules as the app, so an agent cannot write a malformed file.
- **Agent skills**: `init` installs short skills into `.claude/skills/` and a section in
  `AGENTS.md` that tell an agent how this repository tracks work.
- **A linter** (`netherite lint`): broken links, wrong fields, ID collisions, stale docs.
- **Freshness**: a doc that lists the code it `covers` is marked stale when that code has changed
  in git since the doc was reviewed.

## Documentation

| | |
| --- | --- |
| [Getting started](docs/getting-started.md) | `init`, the app, the first items, agents and skills |
| [Install](docs/install.md) | `npx` or global, upgrading, what `init` adds, troubleshooting |
| [Agents](docs/agents.md) | the skills, connecting Claude Code, Cursor and Codex, context |
| [Concepts](docs/concepts.md) | items, IDs, links, states, freshness and context |
| [CLI reference](docs/reference/cli.md) | every command and flag |
| [MCP reference](docs/reference/mcp.md) | the tools and resources an agent sees |
| [Item schemas](docs/reference/schemas.md) | the fields of each item type |
| [Lint rules](docs/reference/lint.md) | what `netherite lint` reports and which problems it fixes |
| [Configuration](docs/reference/config.md) | `.netherite/config.yml` |
| [Obsidian](docs/obsidian.md) | opening the same files in Obsidian |

## Developing

```sh
pnpm install
pnpm build           # all packages and the app
pnpm test            # unit and integration tests
pnpm e2e             # the app in a real browser (needs `pnpm build`)
pnpm lint
pnpm docs:gen        # regenerate docs/reference from the program
```

This repository tracks its own work in `netherite/`; the plan is in `netherite/docs/`.

## Licence

[MIT](LICENSE).

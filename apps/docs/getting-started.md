# Getting started

You need Node 24 or newer and a git repository (an empty one is fine).

## 1. Set up the repository

```sh
cd my-repo
npx @vicentelyrio/netherite init
```

`init` does five things, and only adds, never overwrites:

1. writes `.netherite/config.yml` (see [configuration](reference/config.md)),
2. creates the content folders under `netherite/` (with a `.gitkeep` so git keeps them),
3. adds `.netherite/local/` to `.gitignore` (per-user state such as the agent activity log),
4. installs agent skills into `.claude/skills/` and a short section in `AGENTS.md`,
5. creates the ruleset every agent reads, as a context item, and writes it to `CLAUDE.md` and `AGENTS.md` (see [agents](agents.md#the-ruleset)).

Use `--content docs/tracker` to keep the items somewhere other than `netherite/`, and `--no-skills`
to leave the skills and `AGENTS.md` alone. `netherite init --update` refreshes the skills after an
upgrade. Commit the result when you are happy with it; Netherite never commits for you.

### Already have docs or decision records?

Bring them in instead of writing them again. `scan` looks through the repository and drafts the
list, and `import` writes it:

```sh
npx @vicentelyrio/netherite scan                                          # look through the repo, write a draft
npx @vicentelyrio/netherite import .netherite/local/scan.json --dry-run   # say what would happen
npx @vicentelyrio/netherite import .netherite/local/scan.json             # write it
```

`scan` only reads. It finds READMEs, `docs/`, runbooks, decision records in any format (it keeps
their numbers, statuses and dates) and agent files such as `CLAUDE.md`, and it says what it left
out and why: `node_modules`, changelogs, test fixtures, folders another tool manages, per-folder
`AGENTS.md` files, anything that looks like a secret, and what you already imported. The draft goes
to `.netherite/local/scan.json`, which git ignores. Open it, delete what you do not want, and add a
`title` or `fields` where you know better, before you import. Nothing is written to your documents,
and nothing is committed.

**With an agent.** In Claude Code, or another agent that can read files and run commands, say:

> Migrate this repository's docs and decision records into Netherite.

The `netherite-migrate` skill, which `init` installed, runs `scan` for you, reads what it found,
asks you at each choice (copy or move the originals, keep the old ADR numbers, how big a batch
is), and imports in batches you review, then links the records to each other. See
[Migrate an existing repository](migrate.md).

**By hand.** `import` takes a JSON file, and the draft from `scan` is one. The smallest file is a
source path and a type for each file:

```json
{
  "entries": [
    { "source": "docs/setup.md", "type": "doc" },
    { "source": "docs/adr/0004-use-stow.md", "type": "adr", "id": "ADR-00004" }
  ]
}
```

`type` is `doc`, `runbook`, `context` or `adr`. Every other field is optional, and the
[import reference](reference/import.md) lists them all.

A skill is not a command: `netherite-migrate` and `netherite-discover` are instructions that an
agent follows, so you will not find them in `netherite --help`. `netherite-migrate` brings in what is
already written down. `netherite-discover` is the optional second step: it proposes decision
records for choices nobody wrote down, from your git history, and does not look for documentation.

## 2. Open the app

```sh
npx @vicentelyrio/netherite
```

It starts a server on `http://127.0.0.1:4747` (or the next free port) and opens your browser. The
page and API only answer to this machine, and writes need a token that is given to the page when it
loads, so other sites in your browser cannot change your files.

The rail on the left goes to **Inbox**, **Goals**, **Projects**, **Knowledge**, **Stats**, **Tags**
and **Graph**. <kbd>⌘K</kbd> (or <kbd>Ctrl K</kbd>) searches everything.

## 3. Make your first items

In **Goals**, press *New goal*, give it a title, and open it. *New project* adds a project that
belongs to the goal. Open the project: its board has a column for each state in your config
(`backlog`, `doing`, `blocked`, `done` by default), and *New task* adds a card.

Click a card to open the task. Its checklist is the Markdown list in the file, so ticking a box in
the app is the same edit as typing `[x]`. Switch the toggle at the bottom from *text* to *code* to
see the file beside it.

Or use the command line:

```sh
npx @vicentelyrio/netherite new goal "Run a half marathon"
npx @vicentelyrio/netherite new project "Training plan" --set 'goals=[GOAL-00001]'
npx @vicentelyrio/netherite new task "Long run on Sunday" --set project=PRJ-00001
npx @vicentelyrio/netherite lint
```

Quote values with brackets so your shell leaves them alone. Everything is a file: look at `git status` after each step.

## 4. Write down decisions and docs

Record a lasting decision as an ADR (`npx @vicentelyrio/netherite new adr "Use GNU Stow" --template` starts it with the usual sections; see [templates](templates.md)), then change its status
as it is accepted. Never rewrite an accepted ADR: add a new one that supersedes it, and the
**Decision log** shows the chain.

A doc can list the files it describes:

```yaml
covers: ["zsh/**", "tmux/tmux.conf"]
```

When those files change in git after the doc was last reviewed, the doc shows as drifting, then
stale, in the Knowledge index and the Inbox. *Mark reviewed* resets it.

## 5. Connect an agent

Agents use the MCP server. For Claude Code (other clients are in [agents](agents.md)):

```sh
claude mcp add netherite -- npx @vicentelyrio/netherite mcp
```

For any client that takes a JSON config, run it over stdio:

```json
{
  "mcpServers": {
    "netherite": { "command": "npx", "args": ["@vicentelyrio/netherite", "mcp"] }
  }
}
```

The server finds the workspace from the folder the agent runs in. While `npx @vicentelyrio/netherite` is running,
the same server is also at `http://127.0.0.1:4747/mcp`; the token it needs is printed when the
server starts. The [MCP reference](reference/mcp.md) lists every tool.

The skills `init` installed teach the agent the conventions: find work with `list` and `search`,
change state with `set_state`, never edit IDs by hand, record decisions as ADRs. Agent writes go
through the same checks as yours and are logged in `.netherite/local/`, which is how the Inbox
shows what an agent changed since you last looked.

## 6. Give agents your context

A `context` item holds what an agent should know before it works here: conventions, rules, layout.
Turn on *Include in context* (or set `include_in_context: true`) and run:

```sh
npx @vicentelyrio/netherite context sync
```

This writes the included items, highest priority first and within the token budget, between markers
in `CLAUDE.md` and `AGENTS.md`. Text outside the markers is yours. In CI, `netherite context sync
--check` exits 1 if the files are out of date.

## 7. Keep it healthy

```sh
npx @vicentelyrio/netherite lint                 # exit 0 clean, 1 problems, 2 could not run
npx @vicentelyrio/netherite lint --fix --dry-run # show the fixes it would make
npx @vicentelyrio/netherite lint --fail-on warning
```

Two people can create the same ID on different branches. After the merge, `lint` reports the
collision and `netherite renumber <item>` gives one of them a new ID and rewrites the links.

## Where next

- [Install](install.md): `npx`, a global install, upgrading, and what `init` adds.
- [Agents](agents.md): skills, MCP setup for Claude Code, Cursor and Codex, and troubleshooting.
- [Migrate](migrate.md): bring a repository that already has docs and decision records in.
- [Templates](templates.md): a starter for each item type, and how to make your own.
- [Concepts](concepts.md): how items, IDs, links and freshness work.
- [Obsidian](obsidian.md): the same files open in Obsidian.
- [Reference](reference/cli.md): every command, tool, field and setting.

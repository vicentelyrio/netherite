# Using Netherite with agents

An agent works with Netherite in three ways, and `init` sets up the first and third:

1. **Skills** teach it the conventions for common jobs (Claude Code reads them from `.claude/skills/`).
2. **The MCP server** lets it search, read and change items, with the same checks as the app.
3. **Context** puts your rules into `CLAUDE.md` and `AGENTS.md`, which most agents read on start.

Nothing here lets an agent commit: agents change files, and you review and commit them.

## What `init` installs

| Skill | Use it when | What it does |
| --- | --- | --- |
| `netherite-plan` | you ask it to plan, scope or split work | breaks a goal into a project and tasks with checklists, dependencies and linked decisions |
| `netherite-task` | it works on a task, or you ask what to do next | finds the next task, sets it `doing`, ticks checklist items as each part is verified, sets it `done` |
| `netherite-adr` | a choice with lasting consequences is made or changed | writes an ADR with Context, Decision and Consequences, links it, or supersedes an earlier one |
| `netherite-context` | you ask for repository conventions or background for agents | creates or updates context items and keeps them within the token budget |
| `netherite-migrate` | you ask it to migrate or adopt Netherite in a repository that already has docs | surveys the repository, asks at each choice (copy or move, keep ADR numbers, batch size), plans the work as a project with tasks, and imports in reviewed batches with `netherite import`; see [import](reference/import.md) |
| `netherite-refresh` | `lint` reports a stale doc, or covered code changed | compares the doc with the code, updates what is wrong and marks it reviewed |

Claude Code decides when to use a skill from its description, so you can say "plan this" or "pick up
the next task" and the right one starts. You can also name one: "use netherite-adr for this".

Skills are plain Markdown files in `.claude/skills/<name>/SKILL.md`. Edit one and `init --update`
keeps your version. Skills are only installed for Claude Code; other agents get the same
conventions from `AGENTS.md`, below.

`AGENTS.md` gets a short section between `netherite:skills` markers: items are Markdown files with
IDs, use the MCP server, never rename files or edit IDs by hand, record decisions as ADRs, run
`lint` before finishing. Text outside the markers is yours.

## The ruleset

`init` also creates a context item, *How agents work in this repository*, and runs `context sync`
so `CLAUDE.md` and `AGENTS.md` carry it. It is a short standing instruction, about 300 tokens, and
it is what makes an agent use Netherite without being reminded:

- **Plan first:** before work of more than one step, find a task or project that covers it, or plan
  one with `netherite-plan`.
- **Track as you go:** set the task `doing`, tick checklist items when each part is done and
  verified, set it `done` only when all are ticked, and write what it learned in the task's Notes.
- **Record decisions:** a lasting choice is a `proposed` ADR. It never marks one `accepted` itself.
- **Keep docs honest:** when code a doc covers changes, review the doc in the same work.
- **Ask when it is your call:** scope, naming and trade-offs go to you with a recommendation. It
  does not commit, push or merge unless you ask, and it runs `lint` before it finishes.

It is a normal context item (CTX-00001 in a new workspace, tagged `netherite-ruleset`): edit it,
shorten it or turn off *Include in context*, and `init` will not put the original back. The MCP
server's instructions send agents to it first. `init --no-skills` leaves it out.

## Connect the MCP server

The server runs over standard input and output and finds the workspace from the folder the agent was
started in. Use `--dir <path>` to point it somewhere else.

**Claude Code**

```sh
claude mcp add netherite -- npx @vicentelyrio/netherite mcp
```

Add `--scope project` to share it with the team through `.mcp.json`. If you installed the package
globally or as a dependency, use `netherite mcp` after the `--`.

**Cursor** (`.cursor/mcp.json` in the repository, or the global one) and any client that takes a
JSON config:

```json
{
  "mcpServers": {
    "netherite": { "command": "npx", "args": ["@vicentelyrio/netherite", "mcp"] }
  }
}
```

**Codex** (`~/.codex/config.toml`):

```toml
[mcp_servers.netherite]
command = "npx"
args = ["@vicentelyrio/netherite", "mcp"]
```

None of these three snippets has been run against a real client yet. They
follow each client's documented format; if one does not work, check the server itself with the next
section and compare with that client's own MCP docs.

**While the app is running**, the same server is also at `http://127.0.0.1:4747/mcp` (streamable
HTTP). The token it needs is printed when the server starts, and it changes each time.

## Check that it works

Start the agent in the repository and ask: "List the open tasks in Netherite." It should call
`list` and answer from your files. If it cannot, run the server by hand:

```sh
npx @vicentelyrio/netherite mcp
```

It prints `netherite mcp: serving <path> (<n> items)` on standard error and then waits for a client;
stop it with <kbd>Ctrl C</kbd>. If the path is not your repository, the agent was started in the
wrong folder.

The [MCP reference](reference/mcp.md) lists every tool. The ones you will see most are `list`,
`search`, `get`, `create`, `update`, `set_state` and `toggle_check`.

## What an agent changed

Every write by an agent goes through the same validation as yours and is logged in
`.netherite/local/`. The app's **Inbox** shows what changed since you last looked, so you can review
before you commit. Run `netherite lint` after a long session: it catches broken links and fields an
agent got wrong.

## Give agents your own rules

Conventions, layout and rules that every agent should know belong in `context` items. Turn on
*Include in context* and run:

```sh
npx @vicentelyrio/netherite context sync
```

The items are written, highest priority first and within the token budget (`context.budget`,
8000 by default), between markers in `CLAUDE.md` and `AGENTS.md`. In CI, `netherite context sync
--check` fails if the files are out of date. Keep the set short: everything here costs every agent
tokens on every task.

## If the agent misbehaves

| You see | Why | What to do |
| --- | --- | --- |
| it edits files directly instead of calling the tools | it did not find the server or the instructions | check `/mcp` in Claude Code lists `netherite`; run `context sync`; check `AGENTS.md` has the section |
| a write fails with `… changed on disk since it was read` | the file changed between its read and write | ask it to read the item again and retry; this protects your edits |
| it ignores the skills | skills are Claude Code only, or are out of date | for other agents rely on `AGENTS.md`; run `netherite init --update` |
| it cannot find the workspace | started in another folder | start it in the repository, or add `--dir` to the MCP command |
| it asks to commit | agents here never commit | commit yourself after reviewing `git diff` |

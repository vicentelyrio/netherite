# Configuration

`.netherite/config.yml` configures a workspace. Only `version` is required; everything else has a
default, and unknown keys are kept. `netherite init` writes it with the defaults as comments.
Changes are picked up by a running server; moving `content` needs a restart.

```yaml
version: 1
content: netherite
id_padding: 5
states:
  - { name: backlog, category: todo }
  - { name: doing, category: active }
  - { name: blocked, category: blocked }
  - { name: done, category: done }
freshness:
  drifting: 1
  stale: 10
context:
  budget: 8000
  targets: [claude, agents]
```

| Key | Default | What it does |
| --- | --- | --- |
| `version` | (required) | the config format; `1` |
| `content` | `netherite` | folder, relative to the repository, that holds the item folders |
| `id_padding` | `5` | digits in an ID: `TASK-00042` at 5, `TASK-0042` at 4 |
| `states` | the four above | the states a task can be in, in column order. Each has a `name` and a `category` |
| `states[].category` | | `todo`, `active`, `blocked` or `done` |
| `freshness.drifting` | `1` | commits since review (touching covered files) before a doc is *drifting* |
| `freshness.stale` | `10` | commits before it is *stale* |
| `inbox.rules.<rule>` | `true` | set to `false` to stop the Inbox raising that rule: `stale-doc`, `proposed-adr`, `orphan`, `overdue-task`, `closing-commit`, `new-todo`, `similar-tag` |
| `context.budget` | `8000` | tokens the synced context may use per file (an estimate: characters / 4) |
| `context.targets` | `[claude, agents]` | `claude` writes `CLAUDE.md`, `agents` writes `AGENTS.md`, `mcp` serves it over MCP only |

Task `state` values are checked against `states`, so renaming a state means updating the tasks that
use it (`netherite lint` lists them). A task's colour and its counting as done follow the
**category**, so you can name states freely: `{ name: in_review, category: active }`.

## Files Netherite writes outside the content folder

| Path | Why | Commit it? |
| --- | --- | --- |
| `.netherite/config.yml` | this file | yes |
| `.netherite/local/` | per-user state: the agent activity log | no (`init` ignores it) |
| `CLAUDE.md`, `AGENTS.md` | the synced context, between markers | yes |
| `.claude/skills/netherite-*` | agent skills, installed by `init` | yes |

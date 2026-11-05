<!-- netherite:skills:start -->
<!-- Installed by `netherite init`; `netherite init --update` refreshes it. Edit outside these markers. -->

## How this repo tracks work

Goals, projects, tasks, decisions (ADRs), docs and runbooks are Markdown files with YAML frontmatter, in the content folder named in `.netherite/config.yml`. Each has an ID such as `TASK-00042`; link to items with `[[TASK-00042]]`.

- Use the `netherite` MCP server (`netherite mcp`) to search, create and update items. Do not rename files or edit frontmatter IDs by hand.
- Find work with `list` and `search`; read an item with `get`; change a task with `set_state` and `toggle_check`.
- Record lasting decisions as ADRs. Never rewrite an accepted ADR; supersede it.
- Run `netherite lint` before finishing. Nothing is committed for you.
- Skills for common jobs are in `.claude/skills/netherite-*`.

<!-- netherite:skills:end -->

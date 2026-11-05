# @vicentelyrio/netherite

## 1.0.0

### Major Changes

- 2eefa28: Netherite 1.0: a typed, linked knowledge base in Markdown and git, rebuilt on one library.
  
  - **One package, `@vicentelyrio/netherite`.** `npx @vicentelyrio/netherite` starts a local app, API and MCP server over your repository; `netherite init`, `new`, `lint`, `renumber`, `mcp` and `context sync` are in the same program.
  - **A local app.** Goals by area, a kanban board per project, a task drawer with the file beside it, a knowledge index, doc, ADR and context views, a decision log, a graph you can drag, pan and zoom, search, an inbox, stats and tags. Every edit writes the Markdown files; nothing is committed for you.
  - **Typed items.** Goals, projects, tasks, ADRs, docs, context and runbooks with stable IDs, `[[wikilinks]]`, validated frontmatter and format-preserving edits.
  - **Agents.** An MCP server with full read and write access under the same rules as the app, agent skills installed by `init`, and `CLAUDE.md` / `AGENTS.md` kept in sync from context items within a token budget.
  - **Freshness.** Docs that list the code they `cover` drift and go stale as that code changes in git.
  - **Local and safe.** Loopback only, a per-session token for writes, and no database, account or network service.
  
  This replaces the v1 stack (services, `packages/*` v1, desktop app and web client), which is removed.

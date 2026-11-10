# @vicentelyrio/netherite

## 1.3.0

### Minor Changes

- d4f575a: Move, delete and order goals, projects and tasks from the app.
  
  - **Moving.** Drag a goal to another area. Move a project to another goal, or a task to another project, from a picker that lists the options with their progress.
  - **Deleting.** Delete a task from the app. A goal or project can be deleted once it is empty.
  - **Manual order.** Drag goals within an area, projects on a goal's page, and tasks within or between columns. A line shows where the item will land. Goals, projects and tasks gain an optional `position` field, written only to the item that moved, and items without one keep their order by ID number, so nothing needs migrating. Areas stay alphabetical.
  - **Goals page.** Areas scroll sideways in a full-height view, like the task board.
- 346ebf0: Settings has a theme switcher on the General tab: Netherite, Netherite Light, Dracula, Nord, Catppuccin Mocha, Tokyo Night, Gruvbox Dark and Solarized Light. The choice is saved in this browser and applies at once, with no flash on load.
- 346ebf0: Settings has a General tab, and you can choose how long things wait.
  
  - **Autosave delay.** The Editor tab sets how long the editor waits after you stop typing before it saves.
  - **Notice duration.** The General tab sets how long a notice stays on screen. A notice with an action always stays at least 10 seconds.
- d4f575a: Simpler creation, and app state kept per workspace.
  
  - **Creating items.** New goals, projects, tasks and areas no longer have Create and Cancel buttons. Enter or clicking away creates the item when there is text, and cancels when there is none.
  - **New documents.** A new doc, ADR, context item or runbook opens in the document view. Nothing is written until it has a title, and the editor is then ready for typing.
  - **Several workspaces.** What the app remembers in the browser, such as the last project and hidden Inbox items, is now kept per workspace, so instances open on different repositories no longer share it.
- 470baac: One way around the app from the keyboard.
  
  - **Reaching a page.** Press `g`, then a letter: `g i` for Inbox, `g p` for Projects and so on. A popup lists the next keys if you pause. The `Cmd+letter` page shortcuts are gone, because browsers keep or use most of them. To have one back, rebind the page in Settings under Shortcuts.
  - **Moving around.** `.` and `,` go between the sections of a page, `;` jumps between the sidebar and the page, `j` and `k` move between items, `Enter` opens and `Esc` goes back one level.
  - **Page keys.** The board, task drawer, goals, knowledge, inbox and graph have their own keys, and `?` shows the ones that work where you are.
  - **Fewer collisions.** Settings refuses keys the browser keeps, and `.`, `,`, `;` and `?`.
  - **Esc in the task drawer.** While typing, the first `Esc` leaves the field and the second closes the drawer.
  - **Keyboard drag.** `Enter` on a card now opens it. `Space` still picks it up to drag.
- d4f575a: Link docs and runbooks, and choose what they cover, from the app.
  
  - **Orphans.** A doc or runbook that sets `explains`, `project` or `covers` is no longer an orphan, in the app or in `netherite lint`. ADRs and context items keep the old rule: something must link to them.
  - **Links.** The side panel of a doc or runbook has "Link to…", which writes `explains`, and each of those links can be removed from the same place.
  - **Covers.** The side panel of a doc, runbook or context item lists its `covers` paths and lets you add or remove them.
  - **Runbooks.** A new runbook starts from its template, including a workspace's own, with the first line selected. Docs still start blank.
  - **API.** `POST /items` accepts `template: true` to start the body from the type's template.
- 346ebf0: The app speaks Spanish and Brazilian Portuguese. It starts in the closest match to your browser's language, and a switcher on the General tab in Settings changes it at once. Dates and numbers follow. Your files, the CLI and messages from the server stay as they are.
- 346ebf0: The server can read and change the workspace config.
  
  - **Reading and writing.** `GET` and `PATCH /api/config` read and change `states`, `freshness`, `context` and `inbox.rules`. Other keys are refused.
  - **Your file stays yours.** Only the lines for changed values differ. Comments and unknown keys are kept, and an edit based on an out-of-date file is refused.
- 346ebf0: The Workspace tab in Settings can edit task states: add, rename, reorder and remove them, and choose each one's category. Renaming or removing a state first shows how many tasks use it, since those tasks keep their old state until you update them.
- d4f575a: Clearer decisions and review dates in Knowledge.
  
  - **ADR decisions.** The highlighted box in an ADR now comes from a Markdown blockquote instead of the `Decision` heading, so it also reads properly outside the app. The ADR template and the `netherite-discover` skill write the decision as a blockquote. Existing ADRs need `>` added to the text they want highlighted.
  - **Review dates.** The review button shows "Reviewed at" and the date once an item has been reviewed, and it is disabled for the rest of that day. A tooltip explains what reviewing does.
  - **Opening documents.** Knowledge rows open on double click. A single click shows the preview.
- 346ebf0: Settings has a Workspace tab for what the repository shares.
  
  - **Inbox.** Turn each kind of item the repository raises on or off.
  - **Freshness.** Set how many commits make a doc drifting or stale.
  - **Context.** Set the token budget and which targets get the context.
  - **Your file stays yours.** A change is an uncommitted edit to `.netherite/config.yml` that keeps your comments. A broken config is reported and never overwritten, and an edit made elsewhere is a conflict you can reload from.
- 346ebf0: Vim mode in the Markdown editor.
  
  - **Vim keys.** Turn on Vim mode in Settings to edit with vim keys, with the current mode shown under the editor. `:w` saves.
  - **Drawers.** With Vim mode on, Esc pressed in the editor stays in the editor instead of closing the drawer around it.
- 346ebf0: The Settings page is split into tabs, starting with Editor and Shortcuts. The open tab is kept in the URL, so a reload or a shared link stays on it.

### Patch Changes

- 470baac: Reviewing a doc whose covered files have uncommitted edits now makes sense.
  
  - The warning says the changes are uncommitted instead of counting them as a commit, and Review changes lists the files.
  - Mark reviewed covers uncommitted edits made up to that day, so the warning clears.
  - Mark reviewed confirms with a notice.
- 346ebf0: The app and the docs have a favicon, and their browser tabs now read "Netherite App" and "Netherite Docs".
- d4f575a: Reorganise the internals into small, single-purpose units. Commands, the API, the MCP server and the files Netherite writes behave as before.
  
  - **Structure.** Every module now has its own folder with one entry point, large files are split by responsibility, and tests guard the layout.
  - **Named values.** Item types, statuses and relations use shared enums instead of repeated strings, and `switch` statements are replaced by tables of strategies.
  - **Settings.** Every default now lives in one catalog, with its type, limits, description and where it is set. Nothing new can be configured yet.

## 1.2.0

### Minor Changes

- de64a0f: Goal renaming, consistent empty states, and a quieter Inbox.
  
  - **Goals.** Rename a goal from its page. A view filtered to one area shows `Goals / Area` as a breadcrumb in place of the "All areas" link.
  - **Empty states.** Goals, Projects, Graph and a new one for Stats share one centered layout. Stats shows it when there are no goals, docs, runbooks or ADRs, and the Graph hides its time scrubber when there is nothing to draw.
  - **Notices.** Success and info notices dismiss themselves after 5 seconds, or 10 with an action such as Undo, and hovering holds them. Errors, warnings and "restart needed" stay until dismissed. Notices no longer have a coloured border.
  - **Inbox.** A doc or runbook that nothing links to is no longer raised under "Needs review". It is still raised when it goes stale, and `lint` and the Knowledge filter still list it as an orphan.
  - **Copy.** Knowledge and the Decision log no longer name a `knowledge/` folder, and the ADR starter shows the real file name.

## 1.1.0

### Minor Changes

- 45d9a9a: scan cli command

## 1.0.0

### Major Changes

- 2eefa28: Netherite 1.0: a typed, linked knowledge base in Markdown and git, rebuilt on one library.
  
  - **One package, `@vicentelyrio/netherite`.** `npx @vicentelyrio/netherite` starts a local app, API and MCP server over your repository; `netherite init`, `new`, `lint`, `renumber`, `mcp` and `context sync` are in the same program.
  - **A local app.** Goals by area, a kanban board per project, a task drawer with the file beside it, a knowledge index, doc, ADR and context views, a decision log, a graph you can drag, pan and zoom, search, an inbox, stats and tags. Every edit writes the Markdown files; nothing is committed for you.
  - **Typed items.** Goals, projects, tasks, ADRs, docs, context and runbooks with stable IDs, `[[wikilinks]]`, validated frontmatter and format-preserving edits.
  - **Agents.** An MCP server with full read and write access under the same rules as the app, agent skills installed by `init`, and `CLAUDE.md` / `AGENTS.md` kept in sync from context items within a token budget.
  - **Freshness.** Docs that list the code they `cover` drift and go stale as that code changes in git.
  - **Local and safe.** Loopback only, a per-session token for writes, and no database, account or network service.
  
  - **Templates.** A starter for each item type, with every optional field in a comment: `netherite new --template` and `netherite templates`. A file in `templates/` in the content folder replaces the built-in one for its type, and `lint` warns if it names a field the type does not have.
  - **A ruleset for agents.** `netherite init` creates a short context item that `context sync` writes to `CLAUDE.md` and `AGENTS.md`: plan first, track work as you go, record decisions as `proposed` ADRs, keep docs honest, and ask when a choice is the person's.
  - **Migration.** `netherite import` brings docs, runbooks, context files and ADRs in from a reviewed batch file. It records where each came from (`source`, `imported_at`), skips what is already imported, keeps ADR numbers, and turns links between imported files into links between items. The `netherite-migrate` skill drives it, asking at each choice, and `netherite-discover` proposes ADRs for decisions that were never written down, each marked as reconstructed with its evidence.
  - **Documentation.** A searchable site at https://vicentelyrio.github.io/netherite/: install, agents, templates, migrating a repository, and a reference for the CLI, the MCP server, the schemas and the lint rules.

  This replaces the v1 stack (services, `packages/*` v1, desktop app and web client), which is removed.

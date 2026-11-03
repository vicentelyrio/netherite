---
id: TASK-00078
aliases: [TASK-00078]
type: task
title: Test the app against the designs
created: 2026-11-02T20:20:04Z
created_by: "@vicentelyrio"
project: PRJ-00012
state: doing
depends_on: [TASK-00062, TASK-00065, TASK-00068, TASK-00070, TASK-00071, TASK-00072, TASK-00073, TASK-00074, TASK-00075, TASK-00076, TASK-00077]
---

# Test the app against the designs

- [ ] Run through each screen at 1920x1080 beside Claude Design and list the differences as tasks
- [x] Check keyboard shortcuts, empty states and error states on every screen
- [x] Check progression with a real history: Timeline, scrubber, Stats and Inbox on this repo
- [ ] Record findings here; open a task per defect

## Findings

Real history, this repo, 1920x1080 (3 Nov 2026):

- Inbox: 6 proposed decisions list and triage fine. From commits is 0 because no commit message here says "closes TASK-N", so the rule has nothing to match.
- Timeline: the Today pill covers the 3 Nov axis label. Tasks done today show as slivers at the Today line, which is true to the history.
- Stats: Goal areas shows a bare dash for the no-area group, it should read "No area". Tasks created and done has no x axis labels. Knowledge health shows 2 not tracked and 0 fresh because no doc has `covers` set.
- Goals have no `area` or `horizon`, so the goals overview has one column.

Fixed in the app: Today pill no longer covers the nearest axis label, the no-area group reads "No area", and the created and done chart has week labels.

Shortcuts and states (read from the code and the tests): every screen has a load error state except Search, where a failed request said "No results". Fixed: it now shows "Could not search". Empty states exist on Inbox, Knowledge, Goals, Projects, Decisions, Tags, Stats, Timeline, Graph and Search.

### Against Claude Design (project ff0dc9da-ee91-4636-afeb-0dafb83601a8, "Netherite Refined.dc.html")

Inbox (design `Inbox.dc.html`, frames 10 and 10b) differs from the app:

- Header: the design lists the keys (J K move, ⌘↵ commit, E archive, H snooze) and says "N to triage · captures from inbox.md, the rest raised by the repo".
- Capture field: placeholder "Capture anything — appended to inbox.md" with a ⇧⌘N chip, no Capture button.
- Tabs: All, Captured, Needs review, From commits. The app has Captured, Needs review, From commits and Changes, and no All.
- List: one card per group with a header (name, count, source such as `inbox.md` or "raised by the repo"); rows with an icon tile, title, mono meta line, a chip (Stale doc, Decide, Orphan, Overdue, Closes task, TODO, Tag) and age. The app has a flat list with a text rule label.
- Detail: kind and meta line, Snooze and Archive icon buttons, 22px title. A capture shows "Turn into" (task, doc, ADR, runbook, context), Project, Goal, Tags, Due, the file path and frontmatter it will write, and "Create & commit ⌘↵" with the commit message. Other items show a reason banner, a "Changed since last review" or "Would affect" list, a secondary link and a primary action. The app has none of the file preview or commit.
- Toast after an action shows the commit sha and Undo; the app's toast has Undo only.
- Inbox zero: dashed panel with a check, "Inbox zero", where captures land, and "N snoozed until Monday".
- Rail: tooltips with the key chip, Timeline icon in the third group, avatar "VL".

The design's "Create & commit" is TASK-00068's commit item, which still waits on the git read-only decision.

Stats (design `Stats.dc.html`, frame 12) differs from the app:

- Header: Area select and the 30 days / Quarter / Year switch sit at the right of the heading; the subtitle reads "N goal areas · N projects · computed from git history, nothing tracked separately". In the app they sit in a row below the heading.
- KPI cards: label top left, coloured delta with an arrow top right, 36px value with its caption beside it ("of 40 created", "in progress → done"). The third card is "Commits linked to work" as a percentage of all commits; the app shows a plain commit count. The fourth is "Stale docs · of 12 tracked" in amber.
- Throughput: titled "Throughput" with a subtitle, y axis (max, middle, 0) with dashed gridlines, Done and Created legend, a tooltip with the full week range ("26 Oct – 2 Nov") and week labels "W44". The app has no y axis or gridlines.
- Goal areas: a two-tone bar (share before the period, then the gain), "+N pts" and the share on the title line, and a footer with achieved and idle goals ("achieved · Health", "no tasks done this month · Life"). The app has a single bar.
- Order of cards: row 2 is Throughput and Goal areas, row 3 is Activity (840px), By project and Knowledge health. The app has the heat map last, full width.
- Heat map: month labels, Mon/Wed/Fri labels, Less to More legend, "Hover a day for its commit count". The app has the bare grid.
- By project: a dot, name, bar, count and median cycle time. Same data, different columns.
- Knowledge health: "N files in knowledge/" subtitle and an Open link; the drifting segment is outlined and the stale one has a warning icon; decisions are coloured pills ("3 accepted"); a footer note names the one file most changed without a doc update. The app lists five.

Timeline (design `Timeline.dc.html`, frames 13 and 13b) differs from the app:

- Header: Tasks and Decisions toggle pills, then Quarter / Year / 2 years (no Fit), then a legend (Active, On hold, Waiting, Planned, Overdue, Proposed to accepted).
- Axis: month labels with the year on January, a "Today · 2 Nov" pill with the date, the part after today shaded, a "Planned" label.
- Rows are grouped by goal (dot, name, share), then projects (chevron, status pie, name, "3/10 · due 15 Dec"), then tasks when expanded. The app lists milestones as goals, then projects, then every decision as its own row.
- Bars: on hold is hatched, planned is dashed up to the due date with "due 15 Dec · 43d left", done ends in a check and the duration, a milestone has a flag, overdue is red.
- Decisions are diamonds in a lane above each project's bar, joined by a line from proposed to accepted, with "ADR-007 · supersedes 003" next to them. The app has separate decision rows.
- Tasks show created (ring), the wait (thin line), the active bar, then a check and the days, or "Nd so far" or "Nd overdue".
- Footer: an "Activity, commits per week" strip.

Knowledge index (design `KnowledgeIndex.dc.html`, frames 06 and 06b) is close. Differences:

- Header actions: "Decision log" link and a "New" button with a menu. Same in the app.
- Filter bar is one row: search with a "/" chip, type tabs with each type's glyph, Status, Project and Tag selects, Stale and Orphans pills, Sort at the far right. The app wraps this into two rows at 1920 and has a different Sort position.
- Rows: type badge with glyph; id, title and an "orphan" chip; mono path line; status pill with icon (Accepted, Proposed, Deprecated, Superseded, or an AI context chip with token count); project dot; modified with an avatar; freshness with an icon ("Stale · 14 commits", "3 commits behind"). A superseded title is struck through. The app lacks the avatar, the AI chip, the strike-through and the orphan chip on the row.
- Preview: type badge, Open button, title, path, a stale banner with the cause, summary, backlinks (or "Nothing links here yet"), co-changed files with bars and a footer with avatar and "Updated 2 Jul 2026 · 3e9a1f0". The app has most of it; the stale banner and the avatar footer are missing.
- Empty state: "No knowledge in this repo yet" with Record first decision, Import from docs/ and four starter cards.


Tags (design `Tags.dc.html`, frame 11) is close to the app. Differences:

- Header: a "Possible duplicates" button with a count, at the right. The app has no such button.
- Filter bar: search with a "/" chip and Map / List with icons (bubble and list). The app adds All / Tags / Labels tabs the design does not have.
- A legend at the right of the bar: size is items tagged, thickness is tagged together, dashed is likely duplicate.
- The detail panel is always there, full height at the right, with Rename and Merge… buttons. The app shows a small "Pick a tag" box until one is picked.
- Detail content: a duplicate banner ("nvim and neovim look like the same tag", Merge and Keep both), a "Used in" bar by goals, projects, tasks and docs with counts, "Often tagged with" bars with "N shared", "Recent items", and a footer with the grep that finds the tag. 
- The map has zoom in and out buttons; the app has them plus fit.

Search (design `SearchPalette.dc.html`, frame 09), to check by eye:

- Chips in order All, ADRs, Tasks, Docs, Context, Projects, Goals, each with its glyph and count.
- Groups: Decisions, Tasks, Docs & runbooks, AI context, Projects. A superseded decision is struck through. The footer reads "N results · titles, paths and body" and lists ↑↓ navigate, ↵ open, ⌘↵ open as split, tab next type.

Goals overview (design `GoalsOverview.dc.html`, frame 01):

- No page title; the breadcrumb is followed by three 440px columns, 56px apart.
- Column header: area name (20px), a one-line description ("Goals and decisions for life") and a 56px ring with the share done.
- Goal card: a horizon row with an icon on the left (infinity for forever, hourglass for "5 years"), the title, tags, a bar with "18/24". "Achieved" sits at the right of the horizon row. The app puts the horizon at the right, and adds a status glyph the design does not show here.
- Each column ends in a dashed "New goal"; there is no "New area" tile. The app has a New area tile and no area description.

Project board (design `ProjectBoard.dc.html`, frames 03 and 03b):

- Left column (360px): breadcrumb with the goal's area and name ("Knowledge / Development"), title, description, then the view switch as four icon buttons (Tasks, Design, Docs, Knowledge) with the current view's name beside it. The app has three icons and a label that reads "Tasks" in a different place. The Graph panel sits at the bottom with a "Graph" title and an open-in-full icon.
- Board starts at 552px, four equal columns 16px apart. Each column is a rounded panel with an icon, name, count pill and a "more" menu, and "New task" at the bottom. The In progress column has a lilac border. The app's column header is a coloured label chip.
- Card: overline (the project's name in lower case), title, tags, progress bar with "5/7". Done cards are dimmer, with a green count. A card can show "Waiting on X" in amber. Drag states: a dashed drop zone ("Drop to move to In progress"), a tilted card being dragged, a selected card with a halo. The design has no status glyph on cards; the app adds one (TASK-00062).
- Knowledge view: filter chips All, ADR, Doc, Context, Runbook with counts, Decision log link and "New doc" at the right; columns Type, Title, Status, Linked to ("Explains 2 tasks", "Implemented by Set up Brewfile", "No backlinks"), Modified (avatar) and Freshness, grouped into cards like the Knowledge index. The app's table has no chips, no "Linked to" text and no avatar.

Goal detail (design `GoalDetail.dc.html`, frame 02):

- Breadcrumb "Goals / Knowledge / Development" (area in the middle). Title, description, then two 64px rings: Horizon ("10 years", filled by how much of the horizon has passed) and Progress.
- "Projects" with a count and a "New project" link, then project cards whose overline lists every goal the project serves ("Development · Professional").
- The graph fills the right 1240px with a legend panel at its top left. Close to the app; check the overline and the breadcrumb.

Doc view (design `DocView.dc.html`, frames 07a to 07c), to check against the app, which already has most of it:

- Top bar: folder and file path in mono, the type badge, "M 1 line changed" while a file is dirty, close.
- Doc: a stale banner with "Review changes" and "Mark reviewed"; the right rail has Type & status with an owner line and avatar, Freshness with the last commits (sha, subject, age), Backlinks, Outgoing, Co-changed files with bars and "Commits that touched this doc and these files together".
- ADR: a superseded banner ("Superseded by ADR-007 · Use GNU Stow", "Open ADR-007"), a lifecycle stepper (Proposed, Accepted, Superseded, and a dashed "Deprecated, not reached"), Context, a boxed Decision, and Consequences in two columns with plus and minus icons. The rail has the Supersession chain.
- Context: an "Include in AI context" switch with a token count, a bar against the repo budget ("5.1k of 8k") and "Synced to" targets.
- An orphan shows "Orphan: nothing links here" with a "Link from…" button.
- Status bar: errors, warnings, Ln and Col, "Markdown · YAML · adr schema", the branch, and the code / text switch.

ADR timeline (design `AdrTimeline.dc.html`, frame 08):

- Lane headers use the project's name with "3 ADRs · 1 chain"; the app shows the project id ("PRJ-00001"). This is a defect.
- Each commit card lists the changes as "from to" pills (Proposed then Accepted) and a supersession line ("supersedes", "by ADR-007"); a note like "opened with 3 options" can follow. The app shows only the new status.
- Legend at the right of the heading and project tabs (All projects, then one per project), where the app has All projects, No project and a select.

Task drawer (design `TaskDrawer.dc.html`, frames 04, 04b), to check:

- Path "Projects › .dotfiles › Tasks › 1 - Install nvim.md", an "M N lines changed" badge, close.
- Code pane 880px with a diff gutter (green added, amber modified), a warning marker per line with the message beside it.
- Fields in one row: State pill, Created with the author, Assignees, Labels; then a Decisions row with ADR chips and "Link ADR"; title and description; Tasklist with a bar and "4/8"; Related with the empty hint "Add task ids to related: to link them".

Not compared: Graph and the token sheets (built and reviewed in earlier tasks).

Fixed so far against the design: Timeline. Zoom, toggles and a legend sit at the right of the heading; the Today pill carries the date; the part after today is shaded and labelled Planned; a project's decisions are drawn as diamonds in lanes above its bar (one lane per decision), with the open ones dashed up to today; projects show "done/total" and the due date with days left; goals show their share. Decisions of no known project still get their own rows. I kept Fit next to Quarter, Year and 2 years because this repo has three days of history and the fixed zooms squeeze it to a sliver.

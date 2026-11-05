# Using Obsidian with Netherite

Netherite's files are ordinary Markdown with YAML frontmatter and `[[wikilinks]]`, so Obsidian can
open them. The two do not conflict: Netherite never needs Obsidian, and Obsidian can be used to read
and edit what Netherite shows.

## Setting up

1. In Obsidian, *Open folder as vault* and choose the **content folder** (`netherite/` by default),
   or the whole repository if you want to see docs and code beside it.
2. Settings → Files and links: keep **Use [[Wikilinks]]** on, and set *New link format* to
   **Shortest path when possible**.
3. Add `.netherite/` to *Excluded files* if you opened the whole repository.

## Why links work

Every item repeats its ID in `aliases`:

```yaml
id: TASK-00042
aliases: [TASK-00042]
```

Obsidian resolves `[[TASK-00042]]` through aliases, so IDs work as link targets even though the file
is called `TASK-00042-long-run.md`. Netherite resolves the same links by ID, and also accepts
`[[ID|label]]` and `[[ID#Heading]]`. Backlinks, the graph view and quick switching all work on the
IDs. Typing `[[` in Obsidian and picking by title inserts the filename; both forms are valid, but
`[[TASK-00042]]` is the one Netherite writes.

## What to leave alone

- **Do not rename files in Obsidian.** The convention is `<ID>-<slug>.md` in the type's folder.
  `netherite lint` reports a file whose name does not start with its `id` (`file-name-id`) or that
  sits in the wrong folder (`outside-type-folder`), and `netherite lint --fix` renames it back.
- **Do not edit `id`, `type` or `aliases`.** Obsidian's *Properties* panel makes this easy to do by
  accident. A changed `id` shows up as a `file-name-id` or `duplicate-id` problem, and a write
  through Netherite refuses to change `id` or `type`.
- **Relations are IDs, not links.** In the *Properties* panel, `project: PRJ-00001` is plain text,
  not a link, so it does not show in Obsidian's backlinks. Mention the item in the text with
  `[[PRJ-00001]]` when you want an Obsidian backlink; Netherite already counts the frontmatter
  relation.
- **Tags** in `tags:` and `labels:` appear in Obsidian's tag pane only for `tags`. `labels` are
  Netherite's own.

## What Netherite does not read

Obsidian features that have no meaning to Netherite are kept in your files and ignored: embeds
(`![[note]]`), block references (`^id`), callouts, Dataview queries, and plugin frontmatter. They do
not cause lint errors, but they do not appear in the app's graph or panels either. The app renders
the Markdown it understands (GFM: tables, task lists, footnotes, strikethrough) and drops raw HTML.

## Editing in both at once

Both tools read the file from disk each time, and Netherite watches the folder: save in Obsidian and
the running app updates. If you have unsaved edits in Netherite's editor when a file changes under
it, the app tells you and asks whether to reload or keep yours; it never overwrites either side by
itself. Keep your Obsidian vault's own settings folder (`.obsidian/`) out of the content folder's
tracked files, or ignore it in `.gitignore`.

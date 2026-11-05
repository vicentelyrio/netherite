# Import

`netherite import <batch.json>` brings what a repository already has written down (docs, runbooks,
convention files such as `CLAUDE.md`, and existing decision records) into Netherite. An agent
decides what each file is and a person reviews the list; this command does the writing, through the
same checks as every other write. It never commits.

It does not look for files: you give it the list. `netherite scan` drafts one for you by looking
through the repository, and the [migrate skill](../migrate.md) drives both.

```sh
netherite scan                                   # writes .netherite/local/scan.json
netherite import .netherite/local/scan.json --dry-run
```

Or with a file of your own:

```sh
netherite import batch.json --dry-run   # say what would happen, write nothing
netherite import batch.json             # write it
netherite import batch.json --update    # also bring items already imported up to date
```

## The batch file

JSON: a list of entries, or an object with an `entries` list and a default `mode`.

```json
{
  "mode": "copy",
  "entries": [
    { "source": "docs/old/setup.md", "type": "doc" },
    {
      "source": "docs/adr/0004-use-stow.md",
      "type": "adr",
      "id": "ADR-00004",
      "title": "Use GNU Stow",
      "fields": { "status": "accepted", "date": "2019-04-02" }
    },
    { "source": "CLAUDE.md", "type": "context", "fields": { "include_in_context": true } },
    {
      "source": "https://wiki.example.com/deploy",
      "type": "runbook",
      "title": "Deploy",
      "body": "1. Merge to main.\n2. Wait for the pipeline."
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `source` | required: a file in the repository, as a path from its root (no `..`), or a URL |
| `type` | required: `doc`, `runbook`, `context` or `adr` |
| `title` | optional: default is the file's first `#` heading, else its file name |
| `id` | optional: keep an existing number, such as `ADR-00004`. Default is the next free one |
| `fields` | optional: other frontmatter, such as `covers`, `status` or `date`. `id`, `type`, `aliases`, `title`, `created`, `source` and `imported_at` are set by the import and cannot be given |
| `body` | optional: the text, when the source is a URL or the agent rewrote it. A file's text is read from the file otherwise |
| `mode` | optional: `copy` (default) leaves the original; `move` removes it once the item is written |

The item's text is the source's text without its frontmatter, its first `#` heading (which
becomes the title) and any block between `<!-- netherite:... -->` markers, which Netherite itself
wrote, such as the context block in `CLAUDE.md`. Each item records `source` and `imported_at` (today), which is how a second run
finds it again.

## What it does

| Result | When |
| --- | --- |
| `created` | a new item was written |
| `updated` | with `--update`, an item already imported was brought up to date with its source |
| `skipped` | already imported (without `--update`), or already up to date |
| `failed` | the entry is wrong or the schema refused it; the reason is shown and nothing was written for it |

An entry that fails does not stop the others, and the exit code is 1 if any failed. An `id` that is
already in use is a failure: it is never renumbered silently, so the person decides. `--dry-run`
checks the entries and the IDs but not each field against the schema, so a field the schema
refuses shows up only when you write it. `--stub` with `mode: "move"` leaves a one-line note where
the original was, instead of removing it. `--json` prints the whole report, one result per entry.

**Links.** A relative Markdown link from one imported file to another becomes a link between items:
`[the session]` pointing at `0025-session.md` is written as `[[ADR-00025|the session]]`. It is done at the end of
every run, in every file that came from an import, so an earlier batch can point at a later one. A
link to a file that was not imported is left alone, a `#heading` after the path is dropped, and a link
in a code block or a code span is not touched. The report says how many references were linked.

**Titles and deciders.** An ADR's title loses the number in front of it (`0062 — Use X` gives
`Use X`). An imported ADR has no `deciders` unless the entry gives them: whoever runs the import did
not make the decision.

After an import, run `netherite lint` (`source-missing` notes a `source` that was later moved or
deleted) and review the changes with `git diff`.

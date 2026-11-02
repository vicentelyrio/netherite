# Lint rules

`netherite lint` checks every item and reports problems with a rule name, a severity and a place in
the file. `--fail-on` decides which severity makes it exit 1 (default `error`; the repository's own
check uses `warning`). `netherite lint --fix` applies the fixes marked below, never commits, and
`--dry-run` shows the diff first. Pass paths to check only some files.

| Rule | Severity | What it reports | Fix |
| --- | --- | --- | --- |
| `frontmatter` | error | no frontmatter, invalid YAML, or frontmatter that is not a mapping | |
| `schema` | error | a field that breaks the type's [schema](schemas.md): missing, wrong type, not an allowed value, or a state that is not in the config | |
| `duplicate-id` | error | two files use the same ID (usually after a merge); `netherite renumber` resolves it | |
| `missing-alias` | error | `aliases` does not include the item's own ID, so `[[ID]]` would not resolve in Obsidian | add the alias |
| `broken-link` | error | a `[[link]]` or relation that matches no item | |
| `ambiguous-link` | error or warning | a link that matches several items; an error if the ambiguity is an ID or alias, a warning if it is a title or file name | |
| `broken-heading` | warning | `[[ID#Heading]]` where the item has no such heading | |
| `file-name-id` | warning | the file name does not start with the item's ID | rename the file |
| `outside-type-folder` | warning | an item sits outside its type's folder | |
| `stale` | warning | a doc's covered files changed in many commits since it was reviewed | |
| `drifting` | warning | the same, but fewer commits (see `freshness` in the [config](config.md)) | |
| `orphan` | info | nothing links to this item | |
| `unknown-field` | info | a frontmatter field the schema does not know (it is kept as it is) | |

`stale` and `drifting` need git history and are skipped with `--no-git` or when the workspace is not
in a repository. The `--json` output lists every problem with its rule, severity, path, line and
column, for use in CI or an editor.

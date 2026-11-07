export const instructions = [
  'Netherite keeps goals, projects, tasks, decisions (ADRs), docs, context and runbooks as Markdown files in this repository.',
  'Address items only by ID (TASK-00042, ADR-00007), never by title. Use `search` or `list` to find IDs, `get` to read one.',
  'Write with `create`, `update`, `set_state`, `toggle_check`, `link`, `unlink`, `mark_reviewed`. Every write is validated first; errors name the field to fix.',
  'Pass the `hash` from `get` as `base_hash` when editing, so you never overwrite a change made since.',
  "Nothing is committed for you. Run `lint` after a batch of changes. Read the `netherite://context` resource first: it holds this repository's working rules, including how to plan and track work.",
].join('\n')

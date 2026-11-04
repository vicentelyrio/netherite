---
id: ADR-00026
aliases: [ADR-00026]
type: adr
title: Existing projects migrate through agent skills, a plan of tasks and a standing ruleset
created: 2026-11-04T11:36:56Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-04
deciders: ["@vicentelyrio"]
project: PRJ-00004
---

# Existing projects migrate through agent skills, a plan of tasks and a standing ruleset

## Context

A team that adopts Netherite already has knowledge in its repository: READMEs and `docs/`, wikis, decision records in other formats (MADR, Nygard, RFC folders), `CLAUDE.md`, `AGENTS.md` and `.cursorrules`, and decisions that were made but never written down. Today `netherite init` only creates folders. Getting that knowledge in means writing every item by hand, so most projects would start empty.

An AI agent can read and classify that material quickly, but it must not decide for the person. Where to put a document, whether an old ADR keeps its number, and whether a decision that was never recorded really was one are the person's calls. Agents also have no standing instruction to plan with Netherite or to keep it up to date: they only get the short text in the MCP server's `instructions` ([[ADR-00012]]), so a migration, or any other long piece of work, leaves no trace in the workspace.

## Decision

Migration is two agent skills, a command that applies the result, and a standing ruleset for agents.

- **`netherite-migrate`** brings in what is written down: docs and runbooks, existing ADRs, and convention files (which become `context` items). It works in phases: survey the repository read-only; show the candidates; import what the person accepts; link and lint.
- **`netherite-discover`** proposes ADRs for decisions that were never recorded, from evidence in git history, pull request text and dependency changes. It is only offered once `netherite-migrate` has finished, and it runs only if the person says yes. Every ADR it makes is `proposed`, says it was reconstructed, links its evidence, and states how confident it is. It never records a rationale the evidence does not contain.
- **The plan is a project with tasks**, made with `netherite-plan`, not a new item type: one project for the migration, one task per batch, one checklist item per candidate with its source path. Progress shows on the board and in the Inbox, and a rejected candidate is left unticked with a note.
- **The person decides every fork, and the skill recommends.** Whether originals are copied or moved (recommend copy), whether old ADR numbers are kept (recommend keep, renumber only on a clash), whether to run discovery, and how many candidates make a batch (recommend a size from the survey) are each asked as a question with a suggested default. The skill never picks silently.
- **`netherite import`** applies one accepted batch deterministically, so the model does the judging (classifying, titling, summarising) and the CLI does the writing. Each imported item records `source` (the path it came from) and `imported_at`, so running a batch again skips or updates an item instead of duplicating it. Writes go through the same validated core operations as every other write, and `create` already accepts an explicit `id` for kept numbers. No MCP tool is added.
- **A ruleset context item** is created by `netherite init`, with high priority and every target, so `context sync` writes it into `CLAUDE.md` and `AGENTS.md` and the MCP server hands it out. It tells an agent to find or create a task before work of more than one step; to set the task `doing`, tick checklist items as each part is verified, and set it `done` only when all are ticked; to record a lasting decision as a `proposed` ADR; to review a doc when code it covers changes; to put a decision that is the person's to make to them with a recommendation; and not to commit unless asked. The MCP `instructions` point at the same text. People can edit it like any context item, and it counts against the token budget.

Nothing in this flow commits ([[ADR-00022]]), and nothing marks an ADR `accepted` on the person's behalf.

## Consequences

- \+ An existing project starts with its documents, decisions and conventions in Netherite, not an empty workspace.
- \+ The migration shows up as ordinary work, on the same board as everything else, and can be paused and resumed by any agent.
- \+ Discovery cannot pass off a guess as a decision: reconstructed ADRs stay `proposed` with their evidence.
- \+ One ruleset serves every agent that reads `AGENTS.md`, `CLAUDE.md` or MCP, and keeps work tracked without a human reminding it.
- \- `source` and `imported_at` are new fields on imported items, and `netherite import` is new surface to build and keep stable.
- \- A good survey needs the agent to read a lot of a repository, so large repositories need batching, and the agent's classification can be wrong, which is why the person reviews each batch.
- \- The ruleset is always in context, so it has to stay short, and a team that edits it away loses the tracking behaviour.
- \- Copying originals leaves two copies that can drift; the `source` field makes that visible but does not stop it.

Builds on [[ADR-00012]] (MCP), [[ADR-00013]] (context sync), [[ADR-00022]] (nothing commits) and [[ADR-00025]] (retiring docs, which suits a copied original that has been replaced).

---
id: ADR-00027
aliases: [ADR-00027]
type: adr
title: Netherite ships on npm under a name we own, and skills travel inside the package
created: 2026-11-04T20:10:00Z
created_by: "@vicentelyrio"
status: accepted
date: 2026-11-04
deciders: ["@vicentelyrio"]
project: PRJ-00008
---

# Netherite ships on npm under a name we own, and skills travel inside the package

## Context

The README tells people to run `npx netherite init`. The unscoped name `netherite` on npm belongs to someone else (a `0.0.0` placeholder from 2024), so that command would run their package, and ours cannot be published under it. The publish pipeline (Changesets, provenance, a person merges the "Version Packages" pull request) is already in place for a package called `netherite`.

## Decision

- **npm is the distribution channel.** One public package holds the CLI, the MCP server, the local app and the agent skills; the internal `@netherite/*` packages stay private and are bundled into it.
- **The published name is `@vicentelyrio/netherite`**, run as `npx @vicentelyrio/netherite` or installed globally with `npm install --global @vicentelyrio/netherite`. A scope cannot be taken from us, and the `bin` stays `netherite`, so the installed command is short. An npm organisation scope remains possible later if the project outgrows one person's account.
- **Skills, the ruleset and templates ship inside the package**, copied into a repository by `netherite init` and `netherite skills install`. Nothing is fetched at install time and there is no separate skills registry.
- **Documentation, the README and every message that prints a command use the published name**, so a copy-pasted command works.
- **Releases are unchanged:** merging the Changesets pull request publishes, and nothing publishes from a developer machine.

## Consequences

- \+ `npx <name> init` runs our code, and the name cannot be squatted.
- \+ One install gives the CLI, the MCP server, the app and the skills at one version, so they cannot drift apart.
- \- A scoped name is longer to type with `npx`; people who install it globally still get the short `netherite` command.
- \- Renaming touches the README, docs, CLI messages, MCP setup snippets and the release workflow, and must land before the first publish.
- \- Offline or locked-down environments need the package from a mirror, since skills are not downloaded separately.

Builds on [[ADR-00012]] (MCP) and [[ADR-00026]] (skills as the migration path).

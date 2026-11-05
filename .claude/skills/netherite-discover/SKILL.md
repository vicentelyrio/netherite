---
name: netherite-discover
description: Propose ADRs for decisions that were made but never written down, reconstructed from git history, pull request text and dependency changes, each marked as proposed and reconstructed with its evidence and confidence. Use only when the person has agreed to look for unrecorded decisions, usually after a migration.
---

# Propose the decisions nobody recorded

Some decisions in a repository were made and never written down. This skill reconstructs them from evidence and proposes them as ADRs, for the person to accept, correct or throw away. Run it only when the person has said yes: another skill may offer it, but never start it yourself. It needs `git` to read history. Never commit.

What it produces is a guess made from evidence, so it says so everywhere: every ADR is `proposed`, tagged `reconstructed`, links its evidence and states how sure it is. A reason that is not in the evidence is not written: you ask the person.

## 1. Ask first, one question at a time

Put your recommendation first and say why.

1. **How far back?** Recommend the last 12 months or the last 500 commits, whichever is less. Older history is rarely worth the reading.
2. **How many to propose?** Recommend at most 10: more than that is more than a person reviews well.
3. **Any area to focus on?** A folder, a service, a theme such as "build" or "auth". Optional.
4. **May I read pull request text?** Recommend yes if the `gh` command is installed and signed in. It is read only. Without it, use the commit messages.

## 2. Find the evidence

Read history and the current repository, and keep notes of the commit hashes (7 characters) that support each candidate.

- **Commits that explain a choice:** a subject or body with "switch to", "replace", "migrate", "drop", "adopt", "instead of", "because", "so that", "decided".
- **Dependency and tooling changes:** what a manifest or lockfile gained or lost (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, a CI file, a formatter or linter config), read with `git log -p -- <file>`.
- **Large refactors:** commits that touch many files in a folder with a message that says what moved and why.
- **Replaced or deleted modules:** `git log --diff-filter=D --name-only`, and what took their place.
- **Pull request text and linked issues,** if the person allowed it, and comments in the code that say why.

A candidate is a decision with a **before and after**: two things were possible and one was chosen. A routine change, a bug fix or a version bump is not a decision. Skip it.

`search` the existing ADRs first. If one already records the choice, say so and `link` to it instead of proposing another.

## 3. Show the list, and let the person choose

A table: a title that states the decision, the date of the commit that made it, its evidence (hashes), your confidence, and what is missing. Say how many you found and how many you are proposing. Let the person accept, change or drop each one.

**Confidence**, and say which in the ADR:

- **high:** a commit or pull request says both what changed and why.
- **medium:** it says what changed, and a reason is stated somewhere close (an issue, a comment, a README line) but not in the commit.
- **low:** only the change is visible. The reason is not recorded.

For every **low** one, and for any reason you cannot find, ask the person why. If they answer, write it as theirs: "Reason, as told by the person on 2026-03-05: ...". If they do not know, leave "The reason was not recorded." and keep it `low`.

## 4. Plan and track

Use the `netherite-plan` skill, as `netherite-migrate` does: reuse the migration project if there is one, else create one ("Reconstruct unrecorded decisions") linked to a goal the person picks. Make one task per group of candidates, and in each a checklist item per candidate that names the evidence (`- [ ] switch from Jest to Vitest (a1b2c3d)`). Set the task `doing` while you work, and tick an item when its ADR is written and the person has seen it.

## 5. Write each ADR

`create` with `type: adr`, and:

- `fields.status`: `proposed`. Never `accepted`.
- `fields.date`: the date of the commit that made the decision, not today.
- `fields.tags`: `["reconstructed"]`.
- No `deciders`, unless the person names them. Do not infer a person from a commit author.
- A title that states the decision ("Use Vitest instead of Jest").
- A body with these sections, and nothing the evidence does not say:

```
## Context
_Reconstructed from history; it was not recorded when it was made._ What the evidence says about the situation before the change.

## Decision
What was chosen, as the evidence shows it.

## Consequences
- \+ A consequence that you can see in the repository now.
- \- Another, or "Not recorded." if you can see none.

## Evidence
- `a1b2c3d` 2025-03-02 the commit subject (pull request 41)
- Confidence: medium. A reason is stated in the pull request but not in the commit.
- Not known: who weighed the alternatives, and what else was considered.
```

`link` the ADR to the project it affects. Then `lint` and fix what it reports.

## 6. Finish

Tell the person how many ADRs you proposed, at which confidence, which questions are still open, and that every one is `proposed`: they accept an ADR in the app or by telling you to, and you never do it for them. Nothing is committed.

## Do not

- Do not write a reason, an alternative that was rejected, or a consequence that the evidence does not show. "Probably because" is a guess: ask instead.
- Do not mark an ADR `accepted`, and do not write today's date as the decision date.
- Do not name people as deciders from commit authorship.
- Do not propose a bug fix, a version bump or a rename as a decision.
- Do not start without a yes, and do not commit, push or merge.

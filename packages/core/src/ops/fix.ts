import { Effect, FileSystem, Path } from 'effect'
import { appendToList } from '../edit'
import type { Diagnostic, Fix } from '../lint'
import { applyChanges, type Change, readText } from './io'
import { overlayFileSystem } from './overlay'
import { renameFile } from './rename'
import { makeRepo, type Repo } from './repo'

export interface FixChange {
  /** Path relative to the workspace root. */
  readonly path: string
  readonly before: string | null
  /** `null`: the file is deleted (the old path of a rename). */
  readonly after: string | null
}

export interface FixReport {
  /** Fixes that were (or, in a dry run, would be) applied. */
  readonly applied: ReadonlyArray<Fix>
  /** Fixes that could not be applied, with why. */
  readonly skipped: ReadonlyArray<{ readonly fix: Fix; readonly reason: string }>
  /** Every file the fixes change. */
  readonly changes: ReadonlyArray<FixChange>
}

const describe = (fix: Fix) =>
  fix.kind === 'add-alias'
    ? `add alias ${fix.alias} to ${fix.path}`
    : `rename ${fix.path} to ${fix.to}`

/**
 * Applies the fixes that lint diagnostics carry: adding a missing ID to `aliases`, and renaming a
 * file to start with its ID. Fixes are planned on a copy held in memory, so the plan can be
 * shown (`dryRun`) or applied as one atomic write. Nothing is ever committed. Fixes for the same
 * file are applied in a safe order, alias first.
 */
export const applyFixes = (
  repo: Repo,
  diagnostics: ReadonlyArray<Diagnostic>,
  options: { readonly dryRun?: boolean } = {},
) =>
  Effect.gen(function* () {
    const base = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const fixes: Fix[] = []
    const seen = new Set<string>()
    for (const d of diagnostics) {
      if (d.fix === undefined) continue
      const key = JSON.stringify(d.fix)
      if (seen.has(key)) continue
      seen.add(key)
      fixes.push(d.fix)
    }
    // Aliases first: a rename moves the file, and the alias fix is addressed to its old path.
    fixes.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'add-alias' ? -1 : 1))

    // Plan on a copy: a repo over the same items, reading and writing through an overlay.
    const overlay = overlayFileSystem(base)
    const scratch = makeRepo(repo.workspace, repo.index.items())
    const applied: Fix[] = []
    const skipped: Array<{ fix: Fix; reason: string }> = []

    for (const fix of fixes) {
      const step =
        fix.kind === 'add-alias'
          ? Effect.gen(function* () {
              const source = yield* readText(scratch, fix.path)
              const next = yield* appendToList(source, 'aliases', fix.alias)
              if (next === source) return
              yield* applyChanges(scratch, [{ path: fix.path, content: next, before: source }])
            })
          : Effect.asVoid(renameFile(scratch, fix.path, fix.to))
      const outcome = yield* Effect.result(
        step.pipe(
          Effect.provideService(FileSystem.FileSystem, overlay.fs),
          Effect.provideService(Path.Path, path),
        ),
      )
      if (outcome._tag === 'Success') applied.push(fix)
      else skipped.push({ fix, reason: `${describe(fix)}: ${outcome.failure.message}` })
    }

    const root = repo.workspace.root
    const rel = (absolute: string) => path.relative(root, absolute).split(path.sep).join('/')
    const planned = yield* overlay.changes()
    const changes: FixChange[] = planned
      .map((c) => ({ path: rel(c.path), before: c.before, after: c.after }))
      // The overlay saw the temporary files writes use on the way; they never survive a rename.
      .filter((c) => !/\/\.[^/]+\.tmp$/.test(c.path))

    if (options.dryRun !== true && changes.length > 0) {
      const real: Change[] = changes.map((c) => ({
        path: c.path,
        content: c.after,
        before: c.before,
      }))
      yield* applyChanges(repo, real)
    }
    return { applied, skipped, changes } satisfies FixReport
  })

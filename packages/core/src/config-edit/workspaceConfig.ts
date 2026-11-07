import { type Config, ValidationError } from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import { ConflictError, IoError } from '../errors'
import { contentHash } from '../ops/hash'
import { absolute, readText } from '../ops/io'
import type { Repo } from '../ops/repo'
import { enabledRulesOf, type RaisedRule, raisedRules } from '../raised'
import { configFile, parseConfig } from '../workspace'
import { planConfigEdits } from './planConfigEdits'
import { applyConfigEdits } from './spliceConfig'

export interface WorkspaceSettings {
  readonly states: Config['states']
  readonly freshness: Config['freshness']
  readonly context: Config['context']
  readonly inbox: { readonly rules: Readonly<Record<RaisedRule, boolean>> }
}

export interface WorkspaceConfigView {
  readonly hash: string
  readonly settings: WorkspaceSettings
}

export interface WorkspaceConfigUpdate extends WorkspaceConfigView {
  readonly unchanged: boolean
  readonly requiresRestart: boolean
}

const settingsOf = (config: Config): WorkspaceSettings => {
  const on = enabledRulesOf(config)
  return {
    states: config.states,
    freshness: config.freshness,
    context: config.context,
    inbox: {
      rules: Object.fromEntries(raisedRules.map((rule) => [rule, on.has(rule)])) as Record<
        RaisedRule,
        boolean
      >,
    },
  }
}

export const readWorkspaceConfig = (repo: Repo) =>
  Effect.gen(function* () {
    const text = yield* readText(repo, configFile)
    const config = yield* parseConfig(text, configFile)
    return { hash: contentHash(text), settings: settingsOf(config) } satisfies WorkspaceConfigView
  })

const fail = (operation: string) => (cause: unknown) =>
  new IoError({ path: configFile, operation, cause: cause as never })

const conflict = (expected: string, now: string) =>
  new ConflictError({ path: configFile, expected, actual: contentHash(now) })

const replaceFile = (repo: Repo, before: string, next: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const p = yield* Path.Path
    const file = yield* absolute(repo, configFile)
    const temp = p.join(p.dirname(file), `.${p.basename(file)}.${crypto.randomUUID()}.tmp`)
    yield* Effect.gen(function* () {
      yield* fs.writeFileString(temp, next).pipe(Effect.mapError(fail('write')))
      const now = yield* readText(repo, configFile)
      if (now !== before) return yield* conflict(contentHash(before), now)
      yield* fs.rename(temp, file).pipe(Effect.mapError(fail('replace')))
    }).pipe(Effect.onError(() => fs.remove(temp, { force: true }).pipe(Effect.ignore)))
  })

export const updateWorkspaceConfig = (
  repo: Repo,
  update: { readonly set: unknown; readonly baseHash: string },
) =>
  Effect.gen(function* () {
    const { edits, issues } = planConfigEdits(update.set)
    if (issues.length > 0) return yield* new ValidationError({ issues })

    const text = yield* readText(repo, configFile)
    if (contentHash(text) !== update.baseHash) return yield* conflict(update.baseHash, text)

    const current = yield* parseConfig(text, configFile)
    const next = applyConfigEdits(text, edits)
    const config = yield* parseConfig(next, configFile)
    const unchanged = next === text
    const requiresRestart = config.content !== repo.workspace.config.content

    if (!unchanged) yield* replaceFile(repo, text, next)
    if (!unchanged && !requiresRestart) repo.applyConfig(config)

    return {
      hash: contentHash(next),
      settings: settingsOf(unchanged ? current : config),
      unchanged,
      requiresRestart,
    } satisfies WorkspaceConfigUpdate
  })

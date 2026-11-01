import { createHash } from 'node:crypto'
import { applyMarkedBlock, type Markers } from '@netherite/core'
import { Effect, FileSystem, Path } from 'effect'
import { agentsSection, type Skill, skills } from '../skills'

/** Where the hash of each installed skill is kept, so an edit by a person can be told apart. */
export const skillsLock = '.netherite/skills.json'
export const skillsFolder = '.claude/skills'

export const agentsMarkers: Markers = {
  start: '<!-- netherite:skills:start -->',
  end: '<!-- netherite:skills:end -->',
  notice:
    '<!-- Installed by `netherite init`; `netherite init --update` refreshes it. Edit outside these markers. -->',
}

export type SkillStatus =
  /** Written for the first time. */
  | 'created'
  /** Replaced with a newer version; the person had not changed it. */
  | 'updated'
  /** Already the current version. */
  | 'unchanged'
  /** An older version the person has not changed; `--update` would replace it. */
  | 'outdated'
  /** Changed by a person, so it is left alone. */
  | 'edited'

export interface InstalledSkill {
  readonly name: string
  readonly path: string
  readonly status: SkillStatus
}

export interface SkillsReport {
  readonly skills: ReadonlyArray<InstalledSkill>
  /** What happened to the `AGENTS.md` section. `damaged` means its markers are broken. */
  readonly agents: 'created' | 'updated' | 'unchanged' | 'damaged'
}

const sha = (text: string) => createHash('sha256').update(text).digest('hex')

type Lock = Record<string, string>

const readLock = (text: string | undefined): Lock => {
  if (text === undefined) return {}
  try {
    const parsed = JSON.parse(text) as { skills?: Lock }
    return typeof parsed.skills === 'object' && parsed.skills !== null ? parsed.skills : {}
  } catch {
    return {}
  }
}

const fileOrUndefined = (file: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    return (yield* fs.exists(file)) ? yield* fs.readFileString(file) : undefined
  })

/**
 * Installs the skills into `.claude/skills/` and the "How this repo tracks work" section into
 * `AGENTS.md`. Without `update` it only adds what is missing. With it, a skill that is an older
 * version of ours is replaced, but one that has been edited is never overwritten: a skill counts
 * as edited when it differs from the hash recorded when it was installed (or has no record).
 */
export const installSkills = (root: string, options: { readonly update: boolean }) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const lockFile = path.join(root, skillsLock)
    const lock = readLock(yield* fileOrUndefined(lockFile))
    const next: Lock = { ...lock }

    const installed: InstalledSkill[] = []
    for (const skill of skills as ReadonlyArray<Skill>) {
      const rel = `${skillsFolder}/${skill.name}/SKILL.md`
      const file = path.join(root, rel)
      const current = yield* fileOrUndefined(file)
      const write = Effect.gen(function* () {
        yield* fs.makeDirectory(path.dirname(file), { recursive: true })
        yield* fs.writeFileString(file, skill.text)
        next[skill.name] = sha(skill.text)
      })

      let status: SkillStatus
      if (current === undefined) {
        yield* write
        status = 'created'
      } else if (current === skill.text) {
        next[skill.name] = sha(skill.text)
        status = 'unchanged'
      } else if (lock[skill.name] !== sha(current)) {
        status = 'edited'
      } else if (options.update) {
        yield* write
        status = 'updated'
      } else {
        status = 'outdated'
      }
      installed.push({ name: skill.name, path: rel, status })
    }

    if (JSON.stringify(next) !== JSON.stringify(lock)) {
      yield* fs.makeDirectory(path.dirname(lockFile), { recursive: true })
      yield* fs.writeFileString(lockFile, `${JSON.stringify({ skills: next }, null, 2)}\n`)
    }

    // AGENTS.md: add the section if missing; refresh it only on update.
    const agentsFile = path.join(root, 'AGENTS.md')
    const existing = yield* fileOrUndefined(agentsFile)
    let agents: SkillsReport['agents'] = 'unchanged'
    const present = existing?.includes(agentsMarkers.start) === true
    if (!present || options.update) {
      const result = yield* Effect.result(
        Effect.try({
          try: () => applyMarkedBlock(agentsMarkers, 'AGENTS.md', existing ?? null, agentsSection),
          catch: () => 'damaged' as const,
        }),
      )
      if (result._tag === 'Failure') agents = 'damaged'
      else if (result.success !== null && result.success !== existing) {
        yield* fs.writeFileString(agentsFile, result.success)
        agents = existing === undefined ? 'created' : 'updated'
      }
    }
    return { skills: installed, agents } satisfies SkillsReport
  })

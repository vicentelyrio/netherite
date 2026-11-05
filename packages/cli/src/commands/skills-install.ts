import { createHash } from 'node:crypto'
import { applyMarkedBlock, type Markers } from '@netherite/core'
import { Effect, FileSystem, Path } from 'effect'
import { agentsSection, type Skill, skills } from '../skills'

export const skillsLock = '.netherite/skills.json'
export const skillsFolder = '.claude/skills'

export const agentsMarkers: Markers = {
  start: '<!-- netherite:skills:start -->',
  end: '<!-- netherite:skills:end -->',
  notice:
    '<!-- Installed by `netherite init`; `netherite init --update` refreshes it. Edit outside these markers. -->',
}

export type SkillStatus = 'created' | 'updated' | 'unchanged' | 'outdated' | 'edited'

export interface InstalledSkill {
  readonly name: string
  readonly path: string
  readonly status: SkillStatus
}

export interface SkillsReport {
  readonly skills: ReadonlyArray<InstalledSkill>
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

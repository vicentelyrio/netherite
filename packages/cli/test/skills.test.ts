import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import { skills } from '../src/skills'
import { cli, git, isolateGit, json } from './helpers'

beforeAll(isolateGit)

const temp = async <A>(use: (dir: string) => Promise<A>) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-skills-')))
  try {
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8')
const skillPath = (name: string) => `.claude/skills/${name}/SKILL.md`
const names = ['adr', 'plan', 'task', 'refresh', 'context', 'migrate', 'discover'].map(
  (n) => `netherite-${n}`,
)

describe('the skills', () => {
  test('are the five from ADR-00013 and the two migration ones from ADR-00026, each with a name and description in its frontmatter', () => {
    expect(skills.map((s) => s.name)).toEqual(names)
    for (const skill of skills) {
      expect(skill.text).toMatch(
        new RegExp(`^---\\nname: ${skill.name}\\ndescription: .{40,}\\n---\\n`),
      )
      expect(skill.text.endsWith('\n')).toBe(true)
    }
  })

  test('name tools the MCP server has', async () => {
    const { toolDefinitions } = await import('@netherite/mcp')
    const { openRepo } = await import('@netherite/core')
    const { NodeServices } = await import('@effect/platform-node')
    const { Effect } = await import('effect')
    const needs: Record<string, string[]> = {
      'netherite-adr': ['search', 'create', 'link', 'set_state', 'lint'],
      'netherite-plan': ['search', 'list', 'create', 'link', 'lint'],
      'netherite-task': ['list', 'get', 'set_state', 'toggle_check', 'update'],
      'netherite-refresh': ['lint', 'get', 'update', 'mark_reviewed'],
      'netherite-context': ['context', 'search', 'update', 'create', 'mark_reviewed'],
    }
    await temp(async (dir) => {
      await cli(dir, 'init')
      const repo = await Effect.runPromise(openRepo(dir).pipe(Effect.provide(NodeServices.layer)))
      const tools = new Set(toolDefinitions(repo).map((t) => t.name))
      for (const skill of skills) {
        for (const tool of needs[skill.name] ?? []) {
          expect(tools.has(tool), `${tool} is a tool`).toBe(true)
          expect(skill.text, `${skill.name} mentions ${tool}`).toContain(`\`${tool}\``)
        }
      }
    })
  })
})

describe('init installs skills', () => {
  test('writes the skills, the AGENTS.md section and the lock file', async () => {
    await temp(async (dir) => {
      const result = await cli(dir, 'init')
      expect(result.code).toBe(0)
      for (const name of names) expect(read(dir, skillPath(name))).toContain(`name: ${name}`)
      const agents = read(dir, 'AGENTS.md')
      expect(agents).toContain('<!-- netherite:skills:start -->')
      expect(agents).toContain('## How this repo tracks work')
      const lock = JSON.parse(read(dir, '.netherite/skills.json')) as { skills: object }
      expect(Object.keys(lock.skills)).toEqual(names)
    })
  })

  test('running again changes nothing', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const before = names.map((n) => read(dir, skillPath(n)))
      const agents = read(dir, 'AGENTS.md')
      const again = await cli(dir, 'init')
      expect(again.stdout.at(-1)).toBe('Already set up.')
      expect(names.map((n) => read(dir, skillPath(n)))).toEqual(before)
      expect(read(dir, 'AGENTS.md')).toBe(agents)
    })
  })

  test('keeps the text already in AGENTS.md', async () => {
    await temp(async (dir) => {
      writeFileSync(join(dir, 'AGENTS.md'), '# Agents\n\nBe kind.\n')
      await cli(dir, 'init')
      const text = read(dir, 'AGENTS.md')
      expect(text.startsWith('# Agents\n\nBe kind.\n\n<!-- netherite:skills:start -->')).toBe(true)
    })
  })

  test('--no-skills installs neither', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init', '--no-skills')
      expect(existsSync(join(dir, '.claude'))).toBe(false)
      expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false)
      expect(existsSync(join(dir, '.netherite/skills.json'))).toBe(false)
    })
  })

  test('--json lists the skills', async () => {
    await temp(async (dir) => {
      const report = json<{
        skills: { skills: Array<{ name: string; status: string }>; agents: string }
      }>(await cli(dir, 'init', '--json'))
      expect(report.skills.skills.map((s) => [s.name, s.status])).toEqual(
        names.map((n) => [n, 'created']),
      )
      expect(report.skills.agents).toBe('created')
    })
  })

  test('the generated workspace still lints clean', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      await cli(dir, 'init')
      expect((await cli(dir, 'lint')).code).toBe(0)
    })
  })

  test('context sync and the skills section live side by side', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      await cli(dir, 'init')
      await cli(
        dir,
        'new',
        'context',
        'Rules',
        '--set',
        'include_in_context=true',
        '--body',
        'Be brief.',
      )
      await cli(dir, 'context', 'sync')
      const agents = read(dir, 'AGENTS.md')
      expect(agents).toContain('<!-- netherite:skills:start -->')
      expect(agents).toContain('<!-- netherite:context:start -->')
      expect(agents).toContain('Be brief.')
      await cli(dir, 'init', '--update')
      expect(read(dir, 'AGENTS.md')).toBe(agents)
      expect((await cli(dir, 'context', 'sync', '--check')).code).toBe(0)
    })
  })
})

describe('init --update', () => {
  test('replaces a skill that is an older version we installed', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const old = 'old text\n'
      const path = skillPath('netherite-adr')
      writeFileSync(join(dir, path), old)
      const { createHash } = await import('node:crypto')
      const lock = JSON.parse(read(dir, '.netherite/skills.json')) as {
        skills: Record<string, string>
      }
      lock.skills['netherite-adr'] = createHash('sha256').update(old).digest('hex')
      writeFileSync(join(dir, '.netherite/skills.json'), JSON.stringify(lock))

      const plain = await cli(dir, 'init')
      expect(plain.stdout.join('\n')).toContain('outdated')
      expect(plain.stdout.join('\n')).toContain('init --update')
      expect(read(dir, path)).toBe(old)

      const updated = await cli(dir, 'init', '--update')
      expect(updated.stdout.join('\n')).toMatch(/updated\s+\.claude\/skills\/netherite-adr/)
      expect(read(dir, path)).toBe(skills[0]?.text)
    })
  })

  test('never overwrites a skill the user edited', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const path = skillPath('netherite-task')
      const mine = `${read(dir, path)}\nAlso: ask me first.\n`
      writeFileSync(join(dir, path), mine)

      const result = await cli(dir, 'init', '--update')
      expect(result.code).toBe(0)
      expect(result.stdout.join('\n')).toMatch(/edited\s+\.claude\/skills\/netherite-task/)
      expect(result.stderr.join('\n')).toContain('left alone')
      expect(read(dir, path)).toBe(mine)
    })
  })

  test("treats an existing skill with no record as the user's", async () => {
    await temp(async (dir) => {
      const path = skillPath('netherite-plan')
      await cli(dir, 'init', '--no-skills')
      const { mkdirSync } = await import('node:fs')
      mkdirSync(join(dir, '.claude/skills/netherite-plan'), { recursive: true })
      writeFileSync(join(dir, path), 'mine\n')
      await cli(dir, 'init', '--update')
      expect(read(dir, path)).toBe('mine\n')
    })
  })

  test('refreshes the AGENTS.md section, and only that', async () => {
    await temp(async (dir) => {
      writeFileSync(join(dir, 'AGENTS.md'), '# Top\n')
      await cli(dir, 'init')
      const text = read(dir, 'AGENTS.md').replace('How this repo tracks work', 'Old heading')
      writeFileSync(join(dir, 'AGENTS.md'), `${text}\nMy footer\n`)

      await cli(dir, 'init')
      expect(read(dir, 'AGENTS.md')).toContain('Old heading')

      await cli(dir, 'init', '--update')
      const after = read(dir, 'AGENTS.md')
      expect(after).toContain('## How this repo tracks work')
      expect(after).not.toContain('Old heading')
      expect(after.startsWith('# Top\n')).toBe(true)
      expect(after.endsWith('\nMy footer\n')).toBe(true)
    })
  })

  test('reports damaged markers without failing or touching the file', async () => {
    await temp(async (dir) => {
      const bad = '<!-- netherite:skills:start -->\nhalf\n'
      writeFileSync(join(dir, 'AGENTS.md'), bad)
      const result = await cli(dir, 'init', '--update')
      expect(result.code).toBe(0)
      expect(result.stdout.join('\n')).toContain('skipped  AGENTS.md')
      expect(read(dir, 'AGENTS.md').startsWith(bad)).toBe(true)
    })
  })

  test('a later update leaves the workspace templates alone', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      await cli(dir, 'init')
      mkdirSync(join(dir, 'netherite/templates'), { recursive: true })
      const own = '---\ntype: doc\n---\n\n# {{title}}\n\n## Ours\n'
      writeFileSync(join(dir, 'netherite/templates/doc.md'), own)
      await cli(dir, 'init', '--update')
      expect(read(dir, 'netherite/templates/doc.md')).toBe(own)
      expect((await cli(dir, 'templates')).stdout).toContain(
        'doc      workspace netherite/templates/doc.md',
      )
    })
  })

  test('the skills that write items point at the templates', () => {
    const text = (name: string) => skills.find((s) => s.name === name)?.text ?? ''
    expect(text('netherite-adr')).toContain('netherite templates adr')
    expect(text('netherite-plan')).toContain('netherite templates task')
    expect(text('netherite-context')).toContain('netherite templates context')
  })
})

describe('the ruleset', () => {
  const rulesetPath = 'netherite/context/CTX-00001-how-agents-work-in-this-repository.md'

  test('init creates it as a high priority context item and writes it to CLAUDE.md and AGENTS.md', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      const result = await cli(dir, 'init')
      expect(result.code).toBe(0)
      expect(result.stdout).toContain('created  CTX-00001  How agents work in this repository')
      expect(result.stdout).toContain('synced   CLAUDE.md')
      expect(result.stdout).toContain('synced   AGENTS.md')
      const item = read(dir, rulesetPath)
      expect(item).toContain('include_in_context: true')
      expect(item).toContain('priority: high')
      expect(item).toContain('targets: [claude, agents, mcp]')
      expect(item).toContain('tags: [netherite-ruleset]')
      for (const file of ['CLAUDE.md', 'AGENTS.md']) {
        const text = read(dir, file)
        expect(text, file).toContain('## Plan first')
        expect(text, file).toContain('Do not commit, push or merge unless asked.')
      }
      expect((await cli(dir, 'context', 'sync', '--check')).code).toBe(0)
      expect((await cli(dir, 'lint', '--fail-on', 'info')).code).toBe(0)
      expect(item.length).toBeLessThan(2000)
    })
  })

  test('init again changes nothing, and an edited ruleset stays as it was edited', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      await cli(dir, 'init')
      const before = ['CLAUDE.md', 'AGENTS.md', rulesetPath].map((f) => read(dir, f))
      const again = await cli(dir, 'init')
      expect(again.stdout.join('\n')).not.toContain('CTX-')
      expect(['CLAUDE.md', 'AGENTS.md', rulesetPath].map((f) => read(dir, f))).toEqual(before)

      writeFileSync(join(dir, rulesetPath), read(dir, rulesetPath).replace('Plan first', 'Plan'))
      await cli(dir, 'init', '--update')
      expect(read(dir, rulesetPath)).toContain('## Plan\n')
      expect(
        existsSync(join(dir, 'netherite/context/CTX-00002-how-agents-work-in-this-repository.md')),
      ).toBe(false)
    })
  })

  test('an existing workspace without one gets it from init, and keeps its other context', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      await cli(dir, 'init', '--no-skills')
      await cli(
        dir,
        'new',
        'context',
        'House rules',
        '--set',
        'include_in_context=true',
        '--body',
        'Be brief.',
      )
      const result = await cli(dir, 'init')
      expect(result.stdout).toContain('created  CTX-00002  How agents work in this repository')
      expect(read(dir, 'CLAUDE.md')).toContain('Be brief.')
      expect(read(dir, 'CLAUDE.md')).toContain('## Plan first')
    })
  })

  test('--no-skills leaves the ruleset out', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      const result = await cli(dir, 'init', '--no-skills')
      expect(result.stdout.join('\n')).not.toContain('CTX-')
      expect(existsSync(join(dir, rulesetPath))).toBe(false)
      expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(false)
    })
  })
})

describe('netherite-migrate', () => {
  const text = skills.find((s) => s.name === 'netherite-migrate')?.text ?? ''

  test('walks the phases of ADR-00026 and asks before it chooses', () => {
    for (const heading of [
      '## 1. Survey (read only)',
      '## 2. Ask, one question at a time',
      '## 3. Plan',
      '## 4. Each batch',
      '## 5. Link and check',
      '## 6. Finish',
    ]) {
      expect(text, heading).toContain(heading)
    }
    expect(text).toContain('Recommend copy')
    expect(text).toContain('Recommend keep')
    expect(text).toContain('`netherite-plan`')
    expect(text).toContain('`netherite-discover`')
    expect(text).toContain('Do not start it unless they say yes')
    expect(text).toContain('Never commit')
  })

  test('says what the real repository showed: what not to import, how to read statuses and covers', () => {
    expect(text).toContain('`.mdc` rule files')
    expect(text).toContain('Per-folder `AGENTS.md` files')
    expect(text).toContain('Never read `.env*` files')
    expect(text).toContain('Folders managed by another tool')
    expect(text).toContain('write a small script that builds the batch')
    expect(text).toContain('**Status as written:**')
    expect(text).toContain('Leave out `deciders`')
    expect(text).toContain('`covers` is what the doc **describes**')
    expect(text).toContain('turns relative links between imported files')
  })

  test('only names commands and flags that exist', async () => {
    const commands = new Set(['init', 'import', 'scan'])
    for (const [, command] of text.matchAll(/`netherite ([a-z]+)[^`]*`/g)) {
      expect(commands.has(command as string), `netherite ${command}`).toBe(true)
    }
    const reference = readFileSync(
      join(import.meta.dirname, '../../../apps/docs/reference/cli.md'),
      'utf8',
    )
    const importHelp = reference.slice(reference.indexOf('## `netherite import`'))
    for (const flag of ['--dry-run', '--stub', '--update']) {
      expect(importHelp, flag).toContain(flag)
    }
    const scanHelp = reference.slice(
      reference.indexOf('## `netherite scan`'),
      reference.indexOf('## `netherite import`'),
    )
    for (const flag of ['--out', '--json', '--nested-agent-files']) {
      expect(scanHelp, flag).toContain(flag)
    }
    expect(text).toContain('netherite scan --json')
    expect(text).toContain('https://vicentelyrio.github.io/netherite/reference/import')
  })
})

describe('netherite-discover', () => {
  const text = skills.find((s) => s.name === 'netherite-discover')?.text ?? ''

  test('asks first, and only writes proposed ADRs that say they were reconstructed', () => {
    for (const heading of [
      '## 1. Ask first, one question at a time',
      '## 2. Find the evidence',
      '## 3. Show the list, and let the person choose',
      '## 4. Plan and track',
      '## 5. Write each ADR',
      '## 6. Finish',
    ]) {
      expect(text, heading).toContain(heading)
    }
    expect(text).toContain('Run it only when the person has said yes')
    expect(text).toContain('Do not start without a yes')
    expect(text).toContain('`fields.status`: `proposed`. Never `accepted`.')
    expect(text).toContain('`fields.tags`: `["reconstructed"]`')
    expect(text).toContain('Reconstructed from history')
    expect(text).toContain('## Evidence')
  })

  test('defines its confidence levels and refuses to invent a reason', () => {
    for (const level of ['**high:**', '**medium:**', '**low:**']) expect(text).toContain(level)
    expect(text).toContain('A reason that is not in the evidence is not written')
    expect(text).toContain('The reason was not recorded.')
    expect(text).toContain('Do not name people as deciders')
    expect(text).toContain('Never commit')
  })

  test('the template it gives is an ADR the workspace accepts', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q', '-b', 'main')
      await cli(dir, 'init', '--no-skills')
      const body =
        '## Context\n\n_Reconstructed from history; it was not recorded when it was made._ Jest was slow.\n\n## Decision\n\nUse Vitest.\n\n## Consequences\n\n- \\+ Faster runs.\n- \\- Two syntaxes for a while.\n\n## Evidence\n\n- `a1b2c3d` 2025-03-02 move to vitest\n- Confidence: medium. A reason is stated in the pull request.\n'
      writeFileSync(join(dir, 'body.md'), body)
      const made = await cli(
        dir,
        'new',
        'adr',
        'Use Vitest instead of Jest',
        '--set',
        'tags=[reconstructed]',
        '--set',
        'date=2025-03-02',
        '--body-file',
        'body.md',
      )
      expect(made.code).toBe(0)
      expect(read(dir, made.stdout[0]?.split(/\s+/)[1] as string)).toContain('status: proposed')
      expect((await cli(dir, 'lint', '--fail-on', 'warning')).code).toBe(0)
    })
  })
})

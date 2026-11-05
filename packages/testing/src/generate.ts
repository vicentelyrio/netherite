import { typeFolders } from './folders'

const prefixes = {
  goal: 'GOAL',
  project: 'PRJ',
  task: 'TASK',
  adr: 'ADR',
  doc: 'DOC',
  context: 'CTX',
  runbook: 'RUN',
} as const
type ItemType = keyof typeof prefixes

const mix: ReadonlyArray<readonly [ItemType, number]> = [
  ['goal', 0.005],
  ['project', 0.03],
  ['task', 0.6],
  ['adr', 0.1],
  ['doc', 0.18],
  ['context', 0.04],
  ['runbook', 0.045],
]

const words =
  'the a of to and in for with on by from into index graph search item link task project goal decision record schema parse file path watch change update review fresh stale drift commit branch merge agent skill context budget token server client render editor board card drawer filter sort group count write read edit fix plan ship test build lint check'.split(
    ' ',
  )

/** A small deterministic random number generator, so generated workspaces are reproducible. */
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export interface GenerateOptions {
  /** Total number of item files. */
  readonly count: number
  readonly seed?: number
  /** Wikilinks per body, on average. Default 4. */
  readonly linksPerItem?: number
}

/**
 * Generates a valid workspace as `{ path: file text }`, with every item type, relationships in
 * frontmatter, checklists and wikilinks to other items. Paths are relative to the repository
 * root, under `netherite/`. For benchmarks and scale tests.
 */
export const generateWorkspaceFiles = ({ count, seed = 1, linksPerItem = 4 }: GenerateOptions) => {
  const random = mulberry32(seed)
  const pick = <T>(list: ReadonlyArray<T>) => list[Math.floor(random() * list.length)] as T
  const sentence = (length: number) => Array.from({ length }, () => pick(words)).join(' ')

  const counts = Object.fromEntries(
    mix.map(([type, share]) => [type, Math.max(1, Math.round(count * share))]),
  ) as Record<ItemType, number>
  const id = (type: ItemType, n: number) => `${prefixes[type]}-${String(n).padStart(5, '0')}`
  const ids = (type: ItemType) => Array.from({ length: counts[type] }, (_, i) => id(type, i + 1))
  const pool = Object.fromEntries(mix.map(([type]) => [type, ids(type)])) as Record<
    ItemType,
    string[]
  >
  const everyId = Object.values(pool).flat()

  const files: Record<string, string> = {}
  const body = (title: string, withChecklist: boolean) => {
    const lines = [`# ${title}`, '']
    for (let i = 0; i < 4; i++) {
      let line = sentence(12)
      const links = Math.round(random() * linksPerItem * 0.5)
      for (let l = 0; l < links; l++) line += ` [[${pick(everyId)}]]`
      lines.push(line, '')
    }
    lines.push('## Details', '', sentence(20), '')
    if (withChecklist) {
      for (let i = 0; i < 5; i++) lines.push(`- [${random() < 0.4 ? 'x' : ' '}] ${sentence(4)}`)
      lines.push('')
    }
    lines.push(`See [[${pick(everyId)}]] and [[${pick(everyId)}#Details]].`)
    return lines.join('\n')
  }

  const file = (type: ItemType, n: number, extra: Record<string, string>, checklist = false) => {
    const itemId = id(type, n)
    const title = sentence(4)
    const front = [
      '---',
      `id: ${itemId}`,
      `aliases: [${itemId}]`,
      `type: ${type}`,
      `title: ${title}`,
      ...Object.entries(extra).map(([k, v]) => `${k}: ${v}`),
      '---',
      '',
    ]
    const slug = title.replace(/ /g, '-')
    files[`netherite/${typeFolders[type]}/${itemId}-${slug}.md`] =
      `${front.join('\n')}${body(title, checklist)}\n`
  }

  for (let n = 1; n <= counts.goal; n++) file('goal', n, { status: 'active' })
  for (let n = 1; n <= counts.project; n++) {
    file('project', n, {
      goals: `[${pick(pool.goal)}]`,
      status: 'active',
      decisions: `[${pick(pool.adr)}]`,
    })
  }
  for (let n = 1; n <= counts.task; n++) {
    file(
      'task',
      n,
      {
        project: pick(pool.project),
        state: pick(['backlog', 'doing', 'blocked', 'done']),
        decisions: `[${pick(pool.adr)}]`,
        ...(n > 1 && random() < 0.3 ? { depends_on: `[${id('task', n - 1)}]` } : {}),
      },
      true,
    )
  }
  for (let n = 1; n <= counts.adr; n++) {
    file('adr', n, {
      status: n > 1 && random() < 0.1 ? 'superseded' : 'accepted',
      date: '2026-01-01',
      ...(n > 1 && random() < 0.1 ? { supersedes: `[${id('adr', n - 1)}]` } : {}),
    })
  }
  for (let n = 1; n <= counts.doc; n++) {
    file('doc', n, {
      explains: `[${pick(pool.project)}]`,
      covers: '["src/**"]',
      reviewed_at: '2026-01-10',
    })
  }
  for (let n = 1; n <= counts.context; n++) {
    file('context', n, { include_in_context: 'true', priority: pick(['high', 'normal', 'low']) })
  }
  for (let n = 1; n <= counts.runbook; n++) file('runbook', n, { covers: '["src/**"]' })

  return files
}

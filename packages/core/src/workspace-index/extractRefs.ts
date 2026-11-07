import type { ScannedItem } from '../scanned-item'
import { stringList, stringOf } from './workspace-index.helpers'
import type { EdgeKind, Ref } from './workspace-index.types'

type FieldSpec = readonly [field: string, kind: EdgeKind, direction: 'out' | 'in', many: boolean]

const frontmatterFields: Record<string, ReadonlyArray<FieldSpec>> = {
  task: [
    ['project', 'belongs_to', 'out', false],
    ['decisions', 'implements', 'out', true],
    ['depends_on', 'depends_on', 'out', true],
    ['related', 'related', 'out', true],
  ],
  project: [
    ['goals', 'belongs_to', 'out', true],
    ['decisions', 'implements', 'out', true],
  ],
  adr: [
    ['project', 'belongs_to', 'out', false],
    ['supersedes', 'supersedes', 'out', true],
    ['superseded_by', 'supersedes', 'in', false],
  ],
  doc: [
    ['explains', 'explains', 'out', true],
    ['project', 'explains', 'out', false],
    ['supersedes', 'supersedes', 'out', true],
    ['superseded_by', 'supersedes', 'in', false],
  ],
  runbook: [
    ['explains', 'explains', 'out', true],
    ['project', 'explains', 'out', false],
    ['supersedes', 'supersedes', 'out', true],
    ['superseded_by', 'supersedes', 'in', false],
  ],
  context: [
    ['explains', 'explains', 'out', true],
    ['project', 'explains', 'out', false],
    ['supersedes', 'supersedes', 'out', true],
    ['superseded_by', 'supersedes', 'in', false],
  ],
}

export const extractRefs = (item: ScannedItem): Ref[] => {
  const data = item.parsed.frontmatter?.data
  const fields = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const refs: Ref[] = []
  for (const [field, kind, direction, many] of frontmatterFields[item.type ?? ''] ?? []) {
    const values = many ? stringList(fields[field]) : stringOf(fields[field])
    for (const target of values) refs.push({ kind, target, direction, field })
  }
  for (const link of item.parsed.links) {
    refs.push({
      kind: 'reference',
      target: link.target,
      ...(link.heading === undefined ? {} : { heading: link.heading }),
      direction: 'out',
      field: 'body',
      position: link.position,
    })
  }
  return refs
}

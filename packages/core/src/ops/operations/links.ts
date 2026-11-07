import { AdrStatus, type ItemType, RelationKind } from '@netherite/schema'
import { Effect } from 'effect'
import { appendToList, setField, unsetField } from '../../edit'
import type { EdgeKind } from '../../workspace-index'
import { readText } from '../io'
import type { Repo } from '../repo'
import { data, invalid, locate, mutate, removeAndPrune } from './mutate'
import type { Op, OpOptions } from './operations.types'
import { restore, supersede } from './setState'

interface Relation {
  readonly field: string
  readonly many: boolean
}

const relations: Partial<Record<ItemType, Partial<Record<EdgeKind, Relation>>>> = {
  task: {
    belongs_to: { field: 'project', many: false },
    implements: { field: 'decisions', many: true },
    depends_on: { field: 'depends_on', many: true },
    related: { field: 'related', many: true },
  },
  project: {
    belongs_to: { field: 'goals', many: true },
    implements: { field: 'decisions', many: true },
  },
  adr: { belongs_to: { field: 'project', many: false } },
  doc: { explains: { field: 'explains', many: true } },
  runbook: { explains: { field: 'explains', many: true } },
  context: { explains: { field: 'explains', many: true } },
}

export interface LinkInput {
  readonly from: string
  readonly to: string
  readonly kind: EdgeKind
}

const relationFor = (repo: Repo, input: LinkInput) =>
  Effect.gen(function* () {
    const from = yield* locate(repo, input.from)
    yield* locate(repo, input.to)
    const relation = relations[from.type as ItemType]?.[input.kind]
    if (relation === undefined) {
      return yield* invalid(
        [input.kind],
        `A ${from.type ?? 'item'} cannot have a "${input.kind}" relationship${input.kind === RelationKind.Reference ? '; write a [[link]] in its text instead' : ''}`,
      )
    }
    return relation
  })

export const link = (repo: Repo, input: LinkInput, options: OpOptions = {}): Op =>
  Effect.gen(function* () {
    if (input.kind === RelationKind.Supersedes) {
      return yield* supersede(repo, { old: input.to, by: input.from }, options)
    }
    const relation = yield* relationFor(repo, input)
    return yield* mutate(repo, [
      {
        id: input.from,
        baseHash: options.baseHash,
        edit: (source, item) => {
          const order = repo.fieldOrder[item.type as ItemType]
          return relation.many
            ? appendToList(source, relation.field, input.to, { order })
            : setField(source, relation.field, input.to, { order })
        },
      },
    ])
  })

export const unlink = (repo: Repo, input: LinkInput, options: OpOptions = {}): Op =>
  Effect.gen(function* () {
    if (input.kind === RelationKind.Supersedes) {
      const older = yield* locate(repo, input.to)
      const status = data(yield* readText(repo, older.path))?.status
      return status === AdrStatus.Superseded
        ? yield* restore(repo, input.to, 'accepted', options)
        : yield* mutate(repo, [
            {
              id: input.from,
              baseHash: options.baseHash,
              edit: (s) => removeAndPrune(s, 'supersedes', input.to),
            },
          ])
    }
    const relation = yield* relationFor(repo, input)
    return yield* mutate(repo, [
      {
        id: input.from,
        baseHash: options.baseHash,
        edit: (source) =>
          relation.many
            ? removeAndPrune(source, relation.field, input.to)
            : unsetField(source, relation.field),
      },
    ])
  })

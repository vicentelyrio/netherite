import { AdrStatus, ItemType, KnowledgeStatus } from '@netherite/schema'
import { Effect } from 'effect'
import { appendToList, setField, unsetField } from '../../edit'
import type { ScannedItem } from '../../scanned-item'
import { readText } from '../io'
import type { Repo } from '../repo'
import { data, fold, invalid, locate, mutate, removeAndPrune } from './mutate'
import type { Op, OpOptions, Step } from './operations.types'
import { updateFields } from './updateItem'

const knowledgeTypes = ['doc', 'runbook', 'context']

const statusesOf = (type: string | undefined) =>
  type === ItemType.Adr
    ? ['proposed', 'accepted', 'deprecated', 'superseded']
    : knowledgeTypes.includes(type ?? '')
      ? ['active', 'deprecated', 'superseded']
      : []

const sameKind = (item: ScannedItem, other: ScannedItem) =>
  item.type === other.type && statusesOf(item.type).includes('superseded')
    ? Effect.succeed(item)
    : Effect.fail(
        invalid(
          ['superseded_by'],
          `${item.id} and ${other.id} must be the same kind of item, an ADR or a doc, runbook or context`,
        ),
      )

export const supersede = (
  repo: Repo,
  input: { readonly old: string; readonly by: string },
  options: OpOptions = {},
): Op =>
  Effect.gen(function* () {
    if (input.old === input.by)
      return yield* invalid(['superseded_by'], 'An item cannot supersede itself')
    const old = yield* locate(repo, input.old)
    yield* sameKind(old, yield* locate(repo, input.by))
    const order = repo.fieldOrder[old.type as ItemType] ?? []
    return yield* mutate(repo, [
      {
        id: input.old,
        baseHash: options.baseHash,
        edit: (source) =>
          fold(source, [
            (t) => setField(t, 'status', 'superseded', { order }),
            (t) => setField(t, 'superseded_by', input.by, { order }),
          ]),
      },
      {
        id: input.by,
        edit: (source) => appendToList(source, 'supersedes', input.old, { order }),
      },
    ])
  })

export const restore = (repo: Repo, oldId: string, status: string, options: OpOptions): Op =>
  Effect.gen(function* () {
    const item = yield* locate(repo, oldId)
    const by = data(yield* readText(repo, item.path))?.superseded_by
    const order = repo.fieldOrder[item.type as ItemType] ?? []
    const steps: Step[] = [
      {
        id: oldId,
        baseHash: options.baseHash,
        edit: (source) =>
          fold(source, [
            (t) =>
              status === KnowledgeStatus.Active
                ? unsetField(t, 'status')
                : setField(t, 'status', status, { order }),
            (t) => unsetField(t, 'superseded_by'),
          ]),
      },
    ]
    if (typeof by === 'string' && repo.index.findById(by).length === 1) {
      steps.push({ id: by, edit: (source) => removeAndPrune(source, 'supersedes', oldId) })
    }
    return yield* mutate(repo, steps)
  })

export const setState = (
  repo: Repo,
  id: string,
  value: string,
  options: OpOptions & { readonly supersededBy?: string } = {},
): Op =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    if (item.type === ItemType.Task) {
      return yield* updateFields(repo, id, { set: { state: value } }, options)
    }
    const allowed = statusesOf(item.type)
    if (allowed.length === 0) {
      return yield* invalid(['state'], 'Only tasks have a state; ADRs and docs have a status')
    }
    if (!allowed.includes(value)) {
      return yield* invalid(['state'], `A ${item.type} status is one of ${allowed.join(', ')}`)
    }
    const current = data(yield* readText(repo, item.path))?.status
    if (value === AdrStatus.Superseded) {
      if (options.supersededBy === undefined) {
        return yield* invalid(
          ['superseded_by'],
          'Required when the status is superseded: say which item replaces this one',
        )
      }
      return yield* supersede(repo, { old: id, by: options.supersededBy }, options)
    }
    if (current === AdrStatus.Superseded) return yield* restore(repo, id, value, options)
    return yield* value === KnowledgeStatus.Active
      ? updateFields(repo, id, { unset: ['status'] }, options)
      : updateFields(repo, id, { set: { status: value } }, options)
  })

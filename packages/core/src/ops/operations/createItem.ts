import {
  formatId,
  ItemType,
  parseId,
  prefixes,
  StateCategoryName,
  ValidationError,
} from '@netherite/schema'
import { Clock, Effect } from 'effect'
import { type Json, renderFrontmatter } from '../../edit'
import { itemRelativePath } from '../../filenames'
import { nextId } from '../../ids'
import { applyChanges } from '../io'
import type { Repo } from '../repo'
import { done, invalid, isoDate, isoDateTime, validate } from './mutate'
import type { Op } from './operations.types'

export interface CreateInput {
  readonly type: ItemType
  readonly title: string
  readonly id?: string
  readonly fields?: Readonly<Record<string, Json>>
  readonly body?: string
  readonly createdBy?: string
  readonly deciders?: ReadonlyArray<string>
}

const reserved = ['id', 'type', 'aliases', 'title', 'created']

const explicitId = (repo: Repo, type: ItemType, given: string, padding: number) =>
  Effect.gen(function* () {
    const parsed = parseId(given)
    if (parsed === undefined || parsed.type !== type) {
      return yield* invalid(
        ['id'],
        `${given} is not a ${type} ID, such as ${formatId(prefixes[type], 1, padding)}`,
      )
    }
    const canonical = formatId(parsed.prefix, parsed.number, padding)
    if (given !== canonical) {
      return yield* invalid(['id'], `Write the ID as ${canonical}`)
    }
    const taken = repo.index
      .items()
      .some((i) => [i.id, i.fileName.match(/^([A-Z]+-\d+)(?:-|$)/)?.[1]].includes(canonical))
    if (taken) return yield* invalid(['id'], `${canonical} is already in use`)
    return canonical
  })

const adrTemplate = '## Context\n\n## Decision\n\n## Consequences'

export const createItem = (repo: Repo, input: CreateInput): Op =>
  Effect.gen(function* () {
    const bad = Object.keys(input.fields ?? {}).filter((f) => reserved.includes(f))
    if (bad.length > 0) {
      return yield* new ValidationError({
        issues: bad.map((field) => ({
          path: [field],
          message: 'Is set by createItem and cannot be given',
        })),
      })
    }
    const now = yield* Clock.currentTimeMillis
    const padding = repo.workspace.config.id_padding
    const id =
      input.id === undefined
        ? nextId(repo.index.items(), input.type, padding)
        : yield* explicitId(repo, input.type, input.id, padding)

    const deciders = input.deciders ?? (input.createdBy === undefined ? [] : [input.createdBy])
    const firstTodo = repo.workspace.config.states.find(
      (s) => s.category === StateCategoryName.Todo,
    )
    const defaults: Record<string, Json> = {
      goal: { status: 'active' },
      project: { status: 'active' },
      task: { state: (firstTodo ?? repo.workspace.config.states[0])?.name ?? 'backlog' },
      adr: {
        status: 'proposed',
        date: isoDate(now),
        ...(deciders.length === 0 ? {} : { deciders }),
      },
      doc: {},
      context: {},
      runbook: {},
    }[input.type] as Record<string, Json>

    const all: Record<string, Json> = {
      id,
      aliases: [id],
      type: input.type,
      title: input.title,
      ...defaults,
      ...(input.fields ?? {}),
      created: isoDateTime(now),
      ...(input.createdBy === undefined ? {} : { created_by: input.createdBy }),
    }
    const order = repo.fieldOrder[input.type]
    const rank = (k: string) => (order.includes(k) ? order.indexOf(k) : order.length)
    const fields = Object.entries(all).sort(([a], [b]) => rank(a) - rank(b))

    const body = input.body ?? (input.type === ItemType.Adr ? adrTemplate : '')
    const text = `${renderFrontmatter(fields)}\n# ${input.title}\n${body === '' ? '' : `\n${body.trim()}\n`}`
    const path = `${repo.contentRoot}/${itemRelativePath(id, input.title)}`

    yield* validate(repo, path, null, text)
    yield* applyChanges(repo, [{ path, content: text, before: null }])
    return done(repo, path, [path], false)
  })

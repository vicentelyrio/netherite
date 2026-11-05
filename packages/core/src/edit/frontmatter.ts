import { Effect } from 'effect'
import {
  Document,
  isMap,
  isNode,
  isScalar,
  isSeq,
  type Pair,
  parseDocument,
  Scalar,
  type YAMLMap,
  type YAMLSeq,
} from 'yaml'
import { EditError } from '../errors'
import { detectEol, findFrontmatter, lineEndAfter, lineStartOf, withEol } from './text'

export interface FieldEditOptions {
  readonly order?: ReadonlyArray<string>
}

export interface ListEditOptions extends FieldEditOptions {
  readonly unique?: boolean
  readonly style?: 'flow' | 'block'
}

export type Json =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<Json>
  | { readonly [key: string]: Json }

const stringifyOptions = { lineWidth: 0, indent: 2, flowCollectionPadding: false } as const

const pairText = (
  key: string,
  value: Json,
  style: 'flow' | 'block',
  eol: string,
  flowHint?: boolean,
) => {
  const doc = new Document()
  const map = doc.createNode({ [key]: value }) as YAMLMap
  const node = (map.items[0] as Pair).value
  const flow =
    flowHint ??
    (style === 'flow' &&
      Array.isArray(value) &&
      value.every((v) => typeof v !== 'object' || v === null))
  if (isSeq(node) && flow) node.flow = true
  doc.contents = map
  return withEol(doc.toString(stringifyOptions).replace(/\r?\n$/, ''), eol)
}

const scalarText = (value: string | number | boolean | null, old: Scalar) => {
  const node = new Scalar(value)
  if (typeof value === 'string' && typeof old.value === 'string' && old.type) node.type = old.type
  return new Document(node).toString(stringifyOptions).replace(/\r?\n$/, '')
}

interface Parsed {
  readonly block: string
  readonly map: YAMLMap | undefined
  readonly eol: string
  readonly start: number
  readonly end: number
  readonly source: string
}

const parseBlock = (source: string): Effect.Effect<Parsed | undefined, EditError> => {
  const span = findFrontmatter(source)
  if (span === undefined) return Effect.succeed(undefined)
  const block = source.slice(span.innerStart, span.innerEnd)
  const doc = parseDocument(block)
  if (doc.errors.length > 0) {
    return Effect.fail(
      new EditError({
        reason: 'invalid-yaml',
        detail: `Frontmatter is not valid YAML: ${doc.errors[0]?.message.split('\n')[0] ?? ''}`,
      }),
    )
  }
  if (doc.contents !== null && !isMap(doc.contents)) {
    return Effect.fail(
      new EditError({ reason: 'not-a-mapping', detail: 'Frontmatter must be a YAML mapping' }),
    )
  }
  return Effect.succeed({
    block,
    map: doc.contents ?? undefined,
    eol: detectEol(source),
    start: span.innerStart,
    end: span.innerEnd,
    source,
  })
}

const keyOf = (pair: Pair) => (isScalar(pair.key) ? String(pair.key.value) : undefined)

const findPair = (map: YAMLMap | undefined, name: string) =>
  map?.items.find((pair) => keyOf(pair) === name)

const splice = (parsed: Parsed, from: number, to: number, text: string) => {
  const block = parsed.block.slice(0, from) + text + parsed.block.slice(to)
  return parsed.source.slice(0, parsed.start) + block + parsed.source.slice(parsed.end)
}

const pairStart = (block: string, pair: Pair) => {
  const keyStart = (pair.key as Scalar).range?.[0] ?? 0
  let start = lineStartOf(block, keyStart)
  while (start > 0) {
    const before = lineStartOf(block, start - 1)
    if (!/^[ \t]*#/.test(block.slice(before, start))) break
    start = before
  }
  return start
}

const pairEnd = (block: string, pair: Pair) => {
  const value = pair.value
  const end = isNode(value) && value.range ? value.range[1] : ((pair.key as Scalar).range?.[1] ?? 0)
  return lineEndAfter(block, Math.max(end, (pair.key as Scalar).range?.[1] ?? 0))
}

const insertionPoint = (parsed: Parsed, name: string, order: ReadonlyArray<string> | undefined) => {
  const wanted = order?.indexOf(name) ?? -1
  if (wanted >= 0 && parsed.map) {
    const next = parsed.map.items.find((pair) => {
      const key = keyOf(pair)
      return key !== undefined && (order?.indexOf(key) ?? -1) > wanted
    })
    if (next !== undefined) return pairStart(parsed.block, next)
  }
  return parsed.block.length
}

const insertPair = (parsed: Parsed, name: string, text: string, order?: ReadonlyArray<string>) => {
  const at = insertionPoint(parsed, name, order)
  const needsBreak =
    at === parsed.block.length && parsed.block.length > 0 && !/\n$/.test(parsed.block)
  return splice(parsed, at, at, `${needsBreak ? parsed.eol : ''}${text}${parsed.eol}`)
}

const withNewFrontmatter = (source: string, name: string, value: Json, style: 'flow' | 'block') => {
  const eol = detectEol(source)
  const head = `---${eol}${pairText(name, value, style, eol)}${eol}---${eol}`
  return source === '' ? head : `${head}${eol}${source}`
}

const isEmptyValue = (pair: Pair) =>
  pair.value === null ||
  pair.value === undefined ||
  (isScalar(pair.value) && pair.value.value === null)

const equal = (node: unknown, value: Json) =>
  JSON.stringify(isNode(node) ? node.toJSON() : node) === JSON.stringify(value)

export const setField = (
  source: string,
  name: string,
  value: Json,
  options: FieldEditOptions & { readonly style?: 'flow' | 'block' } = {},
): Effect.Effect<string, EditError> =>
  Effect.flatMap(parseBlock(source), (parsed) => {
    const style = options.style ?? 'flow'
    if (parsed === undefined) return Effect.succeed(withNewFrontmatter(source, name, value, style))
    const pair = findPair(parsed.map, name)
    if (pair === undefined) {
      return Effect.succeed(
        insertPair(parsed, name, pairText(name, value, style, parsed.eol), options.order),
      )
    }
    if (equal(pair.value, value)) return Effect.succeed(source)

    const old = pair.value
    if (
      isScalar(old) &&
      old.range &&
      old.value !== null &&
      (value === null || typeof value !== 'object') &&
      !(typeof value === 'string' && value.includes('\n')) &&
      !(typeof old.value === 'string' && old.value.includes('\n'))
    ) {
      return Effect.succeed(splice(parsed, old.range[0], old.range[1], scalarText(value, old)))
    }
    const flowHint = isSeq(old) ? old.flow === true : undefined
    return Effect.succeed(
      splice(
        parsed,
        pairStart(parsed.block, pair),
        pairEnd(parsed.block, pair),
        `${pairText(name, value, style, parsed.eol, flowHint)}${parsed.eol}`,
      ),
    )
  })

export const unsetField = (source: string, name: string): Effect.Effect<string, EditError> =>
  Effect.flatMap(parseBlock(source), (parsed) => {
    const pair = parsed === undefined ? undefined : findPair(parsed.map, name)
    if (parsed === undefined || pair === undefined) return Effect.succeed(source)
    const keyStart = lineStartOf(parsed.block, (pair.key as Scalar).range?.[0] ?? 0)
    return Effect.succeed(splice(parsed, keyStart, pairEnd(parsed.block, pair), ''))
  })

const notAList = (name: string) =>
  new EditError({ reason: 'not-a-list', detail: `Field "${name}" is not a list` })

const indentOf = (block: string, offset: number) => {
  const line = block.slice(lineStartOf(block, offset), offset)
  return /^[ \t]*/.exec(line)?.[0] ?? ''
}

const itemText = (value: Json, indent: string, eol: string) => {
  const doc = new Document([value])
  const lines = doc
    .toString(stringifyOptions)
    .replace(/\r?\n$/, '')
    .split('\n')
  return lines.map((line) => `${indent}${line}`).join(eol)
}

const flowItemText = (value: Json) => {
  const doc = new Document()
  const node = doc.createNode(value)
  if (isSeq(node) || isMap(node)) node.flow = true
  doc.contents = node
  return doc.toString(stringifyOptions).replace(/\r?\n$/, '')
}

export const appendToList = (
  source: string,
  name: string,
  value: Json,
  options: ListEditOptions = {},
): Effect.Effect<string, EditError> =>
  Effect.flatMap(parseBlock(source), (parsed) => {
    const style = options.style ?? 'flow'
    if (parsed === undefined)
      return Effect.succeed(withNewFrontmatter(source, name, [value], style))
    const pair = findPair(parsed.map, name)
    if (pair === undefined) {
      return Effect.succeed(
        insertPair(parsed, name, pairText(name, [value], style, parsed.eol), options.order),
      )
    }
    if (isEmptyValue(pair)) {
      return Effect.succeed(
        splice(
          parsed,
          pairStart(parsed.block, pair),
          pairEnd(parsed.block, pair),
          `${pairText(name, [value], style, parsed.eol)}${parsed.eol}`,
        ),
      )
    }
    const list = pair.value
    if (!isSeq(list)) return Effect.fail(notAList(name))
    if ((options.unique ?? true) && list.items.some((item) => equal(item, value))) {
      return Effect.succeed(source)
    }

    const last = list.items.at(-1)
    if (list.flow === true) {
      if (last === undefined || !isNode(last) || !last.range) {
        return Effect.succeed(
          splice(parsed, list.range?.[0] ?? 0, list.range?.[1] ?? 0, flowItemText([value])),
        )
      }
      const multiline = parsed.block.slice(list.range?.[0] ?? 0, last.range[1]).includes('\n')
      const after = last.range[1]
      const comma = /^[ \t]*,/.exec(parsed.block.slice(after))
      if (!multiline)
        return Effect.succeed(splice(parsed, after, after, `, ${flowItemText(value)}`))
      const indent = indentOf(parsed.block, last.range[0])
      return Effect.succeed(
        comma
          ? splice(
              parsed,
              after + comma[0].length,
              after + comma[0].length,
              `${parsed.eol}${indent}${flowItemText(value)},`,
            )
          : splice(parsed, after, after, `,${parsed.eol}${indent}${flowItemText(value)}`),
      )
    }

    if (last === undefined || !isNode(last) || !last.range) {
      return Effect.succeed(
        splice(
          parsed,
          pairStart(parsed.block, pair),
          pairEnd(parsed.block, pair),
          `${pairText(name, [value], style, parsed.eol)}${parsed.eol}`,
        ),
      )
    }
    const at = lineEndAfter(parsed.block, last.range[1])
    const dash = parsed.block.lastIndexOf('-', last.range[0])
    const indent = indentOf(parsed.block, dash)
    const text = `${itemText(value, indent, parsed.eol)}${parsed.eol}`
    const lead = at === parsed.block.length && !/\n$/.test(parsed.block) ? parsed.eol : ''
    return Effect.succeed(splice(parsed, at, at, `${lead}${text}`))
  })

export const removeFromList = (
  source: string,
  name: string,
  value: Json,
): Effect.Effect<string, EditError> =>
  Effect.flatMap(parseBlock(source), (parsed) => {
    if (parsed === undefined) return Effect.succeed(source)
    const pair = findPair(parsed.map, name)
    if (pair === undefined || isEmptyValue(pair)) return Effect.succeed(source)
    const list = pair.value as YAMLSeq
    if (!isSeq(list)) return Effect.fail(notAList(name))
    const index = list.items.findIndex((item) => equal(item, value))
    if (index === -1) return Effect.succeed(source)

    if (list.items.length === 1) {
      return Effect.succeed(
        splice(
          parsed,
          pairStart(parsed.block, pair),
          pairEnd(parsed.block, pair),
          `${pairText(name, [], 'flow', parsed.eol, true)}${parsed.eol}`,
        ),
      )
    }
    const item = list.items[index]
    if (!isNode(item) || !item.range) return Effect.succeed(source)

    if (list.flow === true) {
      const next = list.items[index + 1]
      const prev = list.items[index - 1]
      if (index === 0 && isNode(next) && next.range) {
        return Effect.succeed(splice(parsed, item.range[0], next.range[0], ''))
      }
      if (isNode(prev) && prev.range)
        return Effect.succeed(splice(parsed, prev.range[1], item.range[1], ''))
      return Effect.succeed(source)
    }
    const dash = parsed.block.lastIndexOf('-', item.range[0])
    return Effect.succeed(
      splice(
        parsed,
        lineStartOf(parsed.block, dash),
        lineEndAfter(parsed.block, item.range[1]),
        '',
      ),
    )
  })

export const replaceInList = (
  source: string,
  name: string,
  from: string,
  to: string,
): Effect.Effect<string, EditError> =>
  Effect.flatMap(parseBlock(source), (parsed) => {
    if (parsed === undefined) return Effect.succeed(source)
    const pair = findPair(parsed.map, name)
    if (pair === undefined || isEmptyValue(pair)) return Effect.succeed(source)
    const list = pair.value
    if (!isSeq(list)) return Effect.fail(notAList(name))
    const item = list.items.find((candidate) => equal(candidate, from))
    if (item === undefined) return Effect.succeed(source)
    if (list.items.some((candidate) => equal(candidate, to)))
      return removeFromList(source, name, from)
    if (!isScalar(item) || !item.range) return Effect.succeed(source)
    return Effect.succeed(splice(parsed, item.range[0], item.range[1], scalarText(to, item)))
  })

export const renderFrontmatter = (fields: ReadonlyArray<readonly [string, Json]>, eol = '\n') => {
  const lines = fields.map(([key, value]) => pairText(key, value, 'flow', eol))
  return `---${eol}${lines.map((line) => `${line}${eol}`).join('')}---${eol}`
}

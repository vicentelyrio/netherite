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
} from 'yaml'
import { EditError } from '../../errors'
import { detectEol, findFrontmatter, lineEndAfter, lineStartOf, withEol } from '../text'
import type { Json, Parsed } from './frontmatter.types'

export const stringifyOptions = { lineWidth: 0, indent: 2, flowCollectionPadding: false } as const

export const pairText = (
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

export const scalarText = (value: string | number | boolean | null, old: Scalar) => {
  const node = new Scalar(value)
  if (typeof value === 'string' && typeof old.value === 'string' && old.type) node.type = old.type
  return new Document(node).toString(stringifyOptions).replace(/\r?\n$/, '')
}

export const parseBlock = (source: string): Effect.Effect<Parsed | undefined, EditError> => {
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

export const findPair = (map: YAMLMap | undefined, name: string) =>
  map?.items.find((pair) => keyOf(pair) === name)

export const splice = (parsed: Parsed, from: number, to: number, text: string) => {
  const block = parsed.block.slice(0, from) + text + parsed.block.slice(to)
  return parsed.source.slice(0, parsed.start) + block + parsed.source.slice(parsed.end)
}

export const pairStart = (block: string, pair: Pair) => {
  const keyStart = (pair.key as Scalar).range?.[0] ?? 0
  let start = lineStartOf(block, keyStart)
  while (start > 0) {
    const before = lineStartOf(block, start - 1)
    if (!/^[ \t]*#/.test(block.slice(before, start))) break
    start = before
  }
  return start
}

export const pairEnd = (block: string, pair: Pair) => {
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

export const insertPair = (
  parsed: Parsed,
  name: string,
  text: string,
  order?: ReadonlyArray<string>,
) => {
  const at = insertionPoint(parsed, name, order)
  const needsBreak =
    at === parsed.block.length && parsed.block.length > 0 && !/\n$/.test(parsed.block)
  return splice(parsed, at, at, `${needsBreak ? parsed.eol : ''}${text}${parsed.eol}`)
}

export const withNewFrontmatter = (
  source: string,
  name: string,
  value: Json,
  style: 'flow' | 'block',
) => {
  const eol = detectEol(source)
  const head = `---${eol}${pairText(name, value, style, eol)}${eol}---${eol}`
  return source === '' ? head : `${head}${eol}${source}`
}

export const isEmptyValue = (pair: Pair) =>
  pair.value === null ||
  pair.value === undefined ||
  (isScalar(pair.value) && pair.value.value === null)

export const equal = (node: unknown, value: Json) =>
  JSON.stringify(isNode(node) ? node.toJSON() : node) === JSON.stringify(value)

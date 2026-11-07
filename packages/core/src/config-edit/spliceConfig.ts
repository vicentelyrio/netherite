import {
  Document,
  isMap,
  isNode,
  isScalar,
  isSeq,
  type Node,
  type Pair,
  parseDocument,
  type Scalar,
  type YAMLMap,
} from 'yaml'
import { detectEol, lineEndAfter, lineStartOf, withEol } from '../edit/text'

export interface ConfigEdit {
  readonly path: ReadonlyArray<string>
  readonly value: unknown
}

const yamlStyle = { lineWidth: 0, indent: 2, flowCollectionPadding: true } as const

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const toJs = (node: unknown) => (isNode(node) ? node.toJSON() : node)

const nest = (path: ReadonlyArray<string>, value: unknown): unknown =>
  path.reduceRight((inner, key) => ({ [key]: inner }), value)

const isFlowMapItem = (item: unknown) => isMap(item) && item.flow === true

const applyFlow = (node: unknown, flowItems: boolean) => {
  if (flowItems && isSeq(node)) for (const item of node.items) if (isMap(item)) item.flow = true
}

const renderScalar = (value: unknown) =>
  new Document(value).toString(yamlStyle).replace(/\r?\n$/, '')

const renderValue = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(renderValue).join(', ')}]`
  if (typeof value !== 'object' || value === null) return renderScalar(value)
  const pairs = Object.entries(value).map(([k, v]) => `${renderScalar(k)}: ${renderValue(v)}`)
  return pairs.length === 0 ? '{}' : `{ ${pairs.join(', ')} }`
}

const renderPair = (
  key: string,
  value: unknown,
  indent: string,
  flowItems: boolean,
  eol: string,
) => {
  const doc = new Document()
  const map = doc.createNode({ [key]: value }) as YAMLMap
  applyFlow((map.items[0] as Pair).value, flowItems)
  doc.contents = map
  const lines = doc
    .toString(yamlStyle)
    .replace(/\r?\n$/, '')
    .split('\n')
  return withEol(lines.map((line) => `${indent}${line}`).join('\n'), eol)
}

const keyOf = (pair: Pair) => (isScalar(pair.key) ? String(pair.key.value) : undefined)

const findPair = (map: YAMLMap | null, key: string) =>
  map?.items.find((pair) => keyOf(pair) === key)

const keyStart = (pair: Pair) => (pair.key as Scalar).range?.[0] ?? 0

const valueEnd = (pair: Pair) => {
  const keyEnd = (pair.key as Scalar).range?.[1] ?? 0
  return isNode(pair.value) && pair.value.range ? Math.max(pair.value.range[1], keyEnd) : keyEnd
}

const swap = (text: string, from: number, to: number, next: string) =>
  text.slice(0, from) + next + text.slice(to)

const lineEndBefore = (text: string, end: number) => text.slice(0, end).replace(/\r?\n$/, '').length

const replaceInline = (text: string, node: Node, value: unknown) => {
  const [from, to] = node.range as [number, number, number]
  return swap(text, from, to, renderValue(value))
}

const replacePair = (text: string, pair: Pair, value: unknown, eol: string) => {
  const old = pair.value
  const fitsInline =
    isScalar(old) && old.value !== null && (typeof value !== 'object' || value === null)
  const isFlow = (isMap(old) || isSeq(old)) && old.flow === true
  if ((fitsInline || isFlow) && isNode(old)) return replaceInline(text, old, value)
  const start = keyStart(pair)
  const lineStart = lineStartOf(text, start)
  const end = lineEndBefore(text, lineEndAfter(text, valueEnd(pair)))
  const key = keyOf(pair) as string
  const flowItems = isSeq(old) && old.items.some(isFlowMapItem)
  return swap(
    text,
    lineStart,
    end,
    renderPair(key, value, text.slice(lineStart, start), flowItems, eol),
  )
}

const appendToFile = (text: string, rendered: string, eol: string) => {
  const glue = text === '' || text.endsWith('\n') ? '' : eol
  return `${text}${glue}${rendered}${eol}`
}

const insertPair = (text: string, map: YAMLMap, key: string, value: unknown, eol: string) => {
  const last = map.items.at(-1) as Pair
  const start = keyStart(last)
  const indent = text.slice(lineStartOf(text, start), start)
  const at = lineEndAfter(text, valueEnd(last))
  const glue = at === text.length && !text.endsWith('\n') ? eol : ''
  return swap(text, at, at, `${glue}${renderPair(key, value, indent, false, eol)}${eol}`)
}

const applyInMap = (
  text: string,
  map: YAMLMap,
  [key, ...rest]: ReadonlyArray<string>,
  value: unknown,
  eol: string,
): string => {
  const name = key as string
  const pair = findPair(map, name)
  if (pair === undefined) return insertPair(text, map, name, nest(rest, value), eol)
  if (rest.length === 0) return replacePair(text, pair, value, eol)
  const child = pair.value
  if (isMap(child) && child.flow !== true && child.items.length > 0)
    return applyInMap(text, child, rest, value, eol)
  const current = isMap(child) ? (toJs(child) as Record<string, unknown>) : {}
  const merged = mergeAt(current, rest, value)
  return replacePair(text, pair, merged, eol)
}

const mergeAt = (
  current: Record<string, unknown>,
  [key, ...rest]: ReadonlyArray<string>,
  value: unknown,
): Record<string, unknown> => {
  const name = key as string
  if (rest.length === 0) return { ...current, [name]: value }
  const inner = current[name]
  const base = typeof inner === 'object' && inner !== null ? (inner as Record<string, unknown>) : {}
  return { ...current, [name]: mergeAt(base, rest, value) }
}

export const applyConfigEdit = (text: string, { path, value }: ConfigEdit): string => {
  const doc = parseDocument(text)
  if (same(toJs(doc.getIn(path)), value)) return text
  const eol = detectEol(text)
  const root = doc.contents
  const [top, ...rest] = path
  const blockRoot = isMap(root) && root.flow !== true
  if (root === null || (blockRoot && findPair(root, top as string) === undefined))
    return appendToFile(text, renderPair(top as string, nest(rest, value), '', false, eol), eol)
  if (blockRoot) return applyInMap(text, root, path, value, eol)
  doc.setIn(path, value)
  return doc.toString(yamlStyle)
}

export const applyConfigEdits = (text: string, edits: ReadonlyArray<ConfigEdit>) =>
  edits.reduce(applyConfigEdit, text)

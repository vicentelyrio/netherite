import { Effect } from 'effect'
import { Document, isMap, isNode, isScalar, isSeq, type YAMLSeq } from 'yaml'
import { EditError } from '../../errors'
import { lineEndAfter, lineStartOf } from '../text'
import {
  equal,
  findPair,
  insertPair,
  isEmptyValue,
  pairEnd,
  pairStart,
  pairText,
  parseBlock,
  scalarText,
  splice,
  stringifyOptions,
  withNewFrontmatter,
} from './block'
import type { Json, ListEditOptions } from './frontmatter.types'

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

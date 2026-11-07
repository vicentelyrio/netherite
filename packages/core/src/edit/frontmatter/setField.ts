import { Effect } from 'effect'
import { isScalar, isSeq, type Scalar } from 'yaml'
import type { EditError } from '../../errors'
import { lineStartOf } from '../text'
import {
  equal,
  findPair,
  insertPair,
  pairEnd,
  pairStart,
  pairText,
  parseBlock,
  scalarText,
  splice,
  withNewFrontmatter,
} from './block'
import type { FieldEditOptions, Json } from './frontmatter.types'

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

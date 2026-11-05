import { type HeadingInfo, outlineMarkdown } from '@netherite/markdown'
import { Effect } from 'effect'
import { EditError } from '../errors'
import { detectEol, lineEndAfter, withEol } from './text'

export type CheckSelector = number | { readonly text: string }

export type CheckTarget = CheckSelector | ReadonlyArray<CheckSelector> | { readonly all: true }

const isAll = (target: CheckTarget): target is { readonly all: true } =>
  typeof target === 'object' && !Array.isArray(target) && 'all' in target

export const toggleChecks = (
  source: string,
  target: CheckTarget,
  checked?: boolean,
): Effect.Effect<string, EditError> => {
  const list = outlineMarkdown(source).checklist
  const selectors: ReadonlyArray<CheckSelector> = isAll(target)
    ? list.map((_, i) => i)
    : Array.isArray(target)
      ? (target as ReadonlyArray<CheckSelector>)
      : [target as CheckSelector]
  const found = new Set<number>()
  for (const which of selectors) {
    const index =
      typeof which === 'number'
        ? which >= 0 && which < list.length
          ? which
          : -1
        : (() => {
            const matches = list.flatMap((c, i) => (c.text === which.text ? [i] : []))
            return matches.length === 1 ? (matches[0] as number) : -1
          })()
    if (index === -1) {
      return Effect.fail(
        new EditError({
          reason: 'no-such-check',
          detail:
            typeof which === 'number'
              ? `There is no checklist item ${which} (the file has ${list.length})`
              : `No single checklist item has the text "${which.text}"`,
        }),
      )
    }
    found.add(index)
  }
  let text = source
  for (const index of [...found].sort((a, b) => b - a)) {
    const item = list[index]
    if (item === undefined) continue
    const next = checked ?? !item.checked
    if (next === item.checked) continue
    text = `${text.slice(0, item.toggleOffset)}${next ? 'x' : ' '}${text.slice(item.toggleOffset + 1)}`
  }
  return Effect.succeed(text)
}

export const toggleCheck = (
  source: string,
  which: CheckSelector,
  checked?: boolean,
): Effect.Effect<string, EditError> => toggleChecks(source, which, checked)

export type SectionSelector = string | { readonly text: string; readonly depth?: number }

const findSection = (source: string, which: SectionSelector) => {
  const wanted = (typeof which === 'string' ? which : which.text).trim().toLowerCase()
  const depth = typeof which === 'string' ? undefined : which.depth
  const matches = outlineMarkdown(source).headings.filter(
    (h) => h.text.toLowerCase() === wanted && (depth === undefined || h.depth === depth),
  )
  if (matches.length === 0) {
    return Effect.fail(
      new EditError({ reason: 'no-such-section', detail: `There is no section "${wanted}"` }),
    )
  }
  if (matches.length > 1) {
    return Effect.fail(
      new EditError({
        reason: 'ambiguous-section',
        detail: `"${wanted}" is the title of ${matches.length} sections; give its level to pick one`,
      }),
    )
  }
  return Effect.succeed(matches[0] as HeadingInfo)
}

export interface SectionEditOptions {
  readonly excludeSubsections?: boolean
}

const sectionBounds = (source: string, heading: HeadingInfo, options: SectionEditOptions) => {
  const bodyStart = lineEndAfter(source, heading.position.end.offset ?? 0)
  let end = heading.sectionEnd
  if (options.excludeSubsections) {
    const next = outlineMarkdown(source).headings.find(
      (h) => (h.position.start.offset ?? 0) >= bodyStart,
    )
    if (next !== undefined) end = Math.min(end, next.position.start.offset ?? end)
  }
  return { bodyStart: Math.min(bodyStart, end), end }
}

export const replaceSection = (
  source: string,
  which: SectionSelector,
  content: string,
  options: SectionEditOptions = {},
): Effect.Effect<string, EditError> =>
  Effect.map(findSection(source, which), (heading) => {
    const eol = detectEol(source)
    const { bodyStart, end } = sectionBounds(source, heading, options)
    const old = source.slice(bodyStart, end)
    const text = withEol(content.trim(), eol)
    const core = old.trim()

    let replacement: string
    if (core === '') {
      const followed = end < source.length
      replacement = `${eol}${text}${eol}${followed ? eol : ''}`
    } else {
      const at = old.indexOf(core)
      replacement = old.slice(0, at) + text + old.slice(at + core.length)
    }
    return source.slice(0, bodyStart) + replacement + source.slice(end)
  })

export const appendToSection = (
  source: string,
  which: SectionSelector,
  content: string,
): Effect.Effect<string, EditError> =>
  Effect.map(findSection(source, which), (heading) => {
    const eol = detectEol(source)
    const { bodyStart, end } = sectionBounds(source, heading, { excludeSubsections: true })
    const old = source.slice(bodyStart, end)
    const core = old.trim()
    const text = withEol(content.trim(), eol)
    if (core === '') {
      const followed = end < source.length
      return `${source.slice(0, bodyStart)}${eol}${text}${eol}${followed ? eol : ''}${source.slice(end)}`
    }
    const at = old.indexOf(core) + core.length
    return `${source.slice(0, bodyStart + at)}${eol}${eol}${text}${source.slice(bodyStart + at)}`
  })

export const appendSection = (
  source: string,
  heading: string,
  content: string,
  options: { readonly depth?: 1 | 2 | 3 | 4 | 5 | 6 } = {},
): Effect.Effect<string, EditError> => {
  const title = heading.trim()
  const exists = outlineMarkdown(source).headings.some(
    (h) => h.text.toLowerCase() === title.toLowerCase(),
  )
  if (exists) {
    return Effect.fail(
      new EditError({ reason: 'section-exists', detail: `There is already a section "${title}"` }),
    )
  }
  const eol = detectEol(source)
  const hashes = '#'.repeat(options.depth ?? 2)
  const trailing = source === '' ? eol : (/(\r?\n)*$/.exec(source)?.[0] ?? '')
  const base = source.slice(0, source.length - trailing.length)
  const separator = base === '' ? '' : `${eol}${eol}`
  return Effect.succeed(
    `${base}${separator}${hashes} ${title}${eol}${eol}${withEol(content.trim(), eol)}${trailing}`,
  )
}
